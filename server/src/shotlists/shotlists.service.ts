import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import { Server, Hocuspocus } from '@hocuspocus/server';
import * as Y from 'yjs';
import { AuthService } from '../auth/auth.service';
import type { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';

export type Collaborator = {
  userID: number;
  name: string;
  email: string;
  department?: unknown;
  role?: unknown;
  productionMembership?: unknown;
};
const editingRoles = new Map([
  ['Executive Producer', 'Production'],
  ['Producer', 'Production'],
  ['Co-Producer', 'Production'],
  ['Associate Producer', 'Production'],
  ['1st Assistant Director', 'Production'],
  ['2nd Assistant Director', 'Production'],
  ['Director', 'Creative'],
  ['Director of Photography', 'Creative'],
]);
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

@Injectable()
export class ShotlistsService implements OnModuleDestroy {
  private collab?: Hocuspocus;
  private sockets?: WebSocketServer;
  private saveQueues = new Map<string, Promise<void>>();
  private failedSaves = new Set<string>();
  private recheck?: ReturnType<typeof setInterval>;
  // Each server process owns a single document writer. The database advisory
  // lock below prevents accidental concurrent Railway replicas from diverging.
  private lease?: ReturnType<DataSource['createQueryRunner']>;
  constructor(
    private readonly db: DataSource,
    private readonly auth: AuthService,
  ) {}

  private approved(user: Collaborator) {
    const membership = user.productionMembership as Record<
      string,
      unknown
    > | null;
    if (
      !membership ||
      membership.verified !== true ||
      !Number.isSafeInteger(user.userID) ||
      membership.userID !== user.userID ||
      membership.email !== user.email.toLowerCase() ||
      typeof user.role !== 'string' ||
      !editingRoles.has(user.role) ||
      editingRoles.get(user.role) !== user.department ||
      membership.department !== user.department ||
      membership.role !== user.role ||
      typeof membership.verifiedAt !== 'string' ||
      !Number.isFinite(Date.parse(membership.verifiedAt))
    )
      throw new ForbiddenException(
        'Verified production-team membership in an eligible role is required.',
      );
  }
  async authorize(id: string, user: Collaborator) {
    this.approved(user);
    if (!uuid.test(id))
      throw new ForbiddenException('Shot list is unavailable.');
    const [row] = await this.db.query(
      'SELECT id FROM shot_list_documents WHERE id=$1',
      [id],
    );
    if (!row) throw new ForbiddenException('Shot list is unavailable.');
  }
  async list(user: Collaborator) {
    this.approved(user);
    return {
      items: await this.db.query(
        `SELECT d.id,d.name,d.created_at AS "createdAt",d.updated_at AS "updatedAt"
      FROM shot_list_documents d ORDER BY d.updated_at DESC`,
      ),
    };
  }
  async create(user: Collaborator, name: unknown) {
    this.approved(user);
    if (typeof name !== 'string' || !name.trim() || name.length > 180)
      throw new BadRequestException('Enter a name of up to 180 characters.');
    const id = randomUUID(),
      doc = new Y.Doc();
    doc.getMap('meta').set('name', name.trim());
    doc.getMap('meta').set('schemaVersion', 1);
    await this.db.transaction(async (manager) => {
      await manager.query(
        'INSERT INTO shot_list_documents(id,name,owner_user_id,state) VALUES($1,$2,$3,$4)',
        [id, name.trim(), user.userID, Buffer.from(Y.encodeStateAsUpdate(doc))],
      );
    });
    doc.destroy();
    return { id, name: name.trim() };
  }
  async session(id: string, user: Collaborator) {
    await this.authorize(id, user);
    const [metadata] = await this.db.query(
      'SELECT id,name FROM shot_list_documents WHERE id=$1',
      [id],
    );
    const colors = ['#87d8ff', '#d9b8ff', '#a4d6b3', '#f5c48b'];
    return {
      ...metadata,
      user: {
        id: user.userID,
        name: user.name,
        color: colors[user.userID % colors.length],
      },
    };
  }
  private async persist(
    document: Y.Doc & { broadcastStateless?: (s: string) => void },
    id: string,
  ) {
    const previous = this.saveQueues.get(id) || Promise.resolve();
    const operation = previous
      .catch(() => {})
      .then(async () => {
        const state = Buffer.from(Y.encodeStateAsUpdate(document));
        const digest = createHash('sha256')
          .update(Y.encodeSnapshot(Y.snapshot(document)))
          .digest('hex');
        const name = String(
          document.getMap('meta').get('name') || 'Untitled shot list',
        ).slice(0, 180);
        try {
          await this.db.query(
            'UPDATE shot_list_documents SET state=$2,name=$3,updated_at=now() WHERE id=$1 AND (state IS DISTINCT FROM $2 OR name IS DISTINCT FROM $3)',
            [id, state, name],
          );
          this.failedSaves.delete(id);
          document.broadcastStateless?.(
            JSON.stringify({ type: 'persisted', digest }),
          );
        } catch (error) {
          this.failedSaves.add(id);
          throw error;
        }
      });
    this.saveQueues.set(id, operation);
    try {
      await operation;
    } finally {
      if (this.saveQueues.get(id) === operation) this.saveQueues.delete(id);
    }
  }
  async attach(http: HttpServer) {
    this.lease = this.db.createQueryRunner();
    await this.lease.connect();
    const [lock] = await this.lease.query(
      'SELECT pg_try_advisory_lock(1793426400) AS acquired',
    );
    if (!lock.acquired)
      throw new Error('Only one Shot Lists collaboration replica may run.');
    this.collab = Server.configure({
      name: 'Whiteout Shot Lists',
      quiet: true,
      debounce: 250,
      maxDebounce: 1500,
      timeout: 30000,
      stopOnSignals: false,
    });
    // Hooks are configured here to keep the existing Scheduler verification
    // service authoritative for both HTTP and WebSocket authentication.
    this.collab.configure({
      onAuthenticate: async ({ token, documentName }) => {
        if (!token || token.length > 8192) throw new Error('Session required');
        const user = await this.auth.verifySchedulerToken(token);
        await this.authorize(documentName, user);
        return { user, token, checkedAt: Date.now() };
      },
      beforeHandleMessage: async ({ documentName, context }) => {
        // Refresh the full authorization identity, not only the session validity.
        // Recheck before handling the first message after the freshness window.
        if (Date.now() - context.checkedAt > 30000) {
          const user = await this.auth.verifySchedulerToken(context.token);
          if (user.userID !== context.user.userID)
            throw new Error('Session changed');
          await this.authorize(documentName, user);
          context.user = user;
          context.checkedAt = Date.now();
        } else await this.authorize(documentName, context.user);
      },
      onLoadDocument: async ({ documentName, document }) => {
        const [row] = await this.db.query(
          'SELECT state FROM shot_list_documents WHERE id=$1',
          [documentName],
        );
        if (!row) throw new Error('Shot list unavailable');
        Y.applyUpdate(document, row.state);
        return document;
      },
      onStoreDocument: async ({ documentName, document }) => {
        try {
          await this.persist(document, documentName);
        } catch (error) {
          document.broadcastStateless(
            JSON.stringify({ type: 'persistence-error' }),
          );
          throw error;
        }
      },
      onStateless: async ({ payload, document, documentName, connection }) => {
        if (payload !== 'persistence-status') return;
        if (this.failedSaves.has(documentName))
          await this.persist(document, documentName);
        const [row] = await this.db.query(
          'SELECT state FROM shot_list_documents WHERE id=$1',
          [documentName],
        );
        const stored = new Y.Doc();
        Y.applyUpdate(stored, row.state);
        connection.sendStateless(
          JSON.stringify({
            type: 'persisted',
            digest: createHash('sha256')
              .update(Y.encodeSnapshot(Y.snapshot(stored)))
              .digest('hex'),
          }),
        );
        stored.destroy();
      },
    });
    this.recheck = setInterval(() => {
      for (const doc of this.collab!.documents.values())
        for (const connection of doc.getConnections()) {
          void (async () => {
            const user = await this.auth.verifySchedulerToken(
              connection.context.token,
            );
            if (user.userID !== connection.context.user.userID)
              throw new Error('Session changed');
            await this.authorize(doc.name, user);
            connection.context.user = user;
            connection.context.checkedAt = Date.now();
          })().catch(() =>
            connection.close({
              code: 4403,
              reason: 'Session or membership revoked',
            }),
          );
        }
    }, 30000);
    this.recheck.unref();
    this.sockets = new WebSocketServer({
      noServer: true,
      maxPayload: 2 * 1024 * 1024,
    });
    const origins = new Set(
      (process.env.SHOTLIST_ALLOWED_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    http.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '/', 'http://localhost');
      if (
        url.pathname !== '/api/shotlists/collaboration' ||
        url.search ||
        !origins.has(request.headers.origin || '')
      ) {
        socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }
      this.sockets!.handleUpgrade(request, socket, head, (ws) =>
        this.collab!.handleConnection(ws, request),
      );
    });
  }
  async export(id: string, user: Collaborator) {
    await this.authorize(id, user);
    const connection = await this.collab!.openDirectConnection(id, { user });
    try {
      const doc = connection.document!;
      return {
        meta: doc.getMap('meta').toJSON(),
        scenes: doc.getMap('scenes').toJSON(),
        shots: doc.getMap('shots').toJSON(),
      };
    } finally {
      await connection.disconnect();
    }
  }
  // Import is a single CRDT transaction on the same authoritative document.
  // It never replaces scenes or writes an independent JSON snapshot.
  async import(
    id: string,
    user: Collaborator,
    payload: { batchId?: string; scenes?: unknown[] },
  ) {
    await this.authorize(id, user);
    if (
      !uuid.test(payload?.batchId || '') ||
      !Array.isArray(payload.scenes) ||
      payload.scenes.length > 100
    )
      throw new BadRequestException('Invalid import preview.');
    const scenes = payload.scenes as Array<{
      number: string;
      title?: string;
      shots: Record<string, unknown>[];
    }>;
    const fields = new Set([
      'number',
      'camera',
      'framing',
      'subject',
      'angle',
      'lens',
      'equipment',
      'movement',
      'coverage',
      'notes',
      'focusNotes',
      'lightingNotes',
      'scriptSeconds',
      'setupMinutes',
      'plannedTakes',
      'estimatedMinutes',
      'actualTakes',
      'source',
    ]);
    let count = 0;
    for (const scene of scenes) {
      if (
        !scene ||
        typeof scene !== 'object' ||
        typeof scene.number !== 'string' ||
        !scene.number.trim() ||
        scene.number.length > 80 ||
        (scene.title !== undefined &&
          (typeof scene.title !== 'string' || scene.title.length > 500)) ||
        !Array.isArray(scene.shots)
      )
        throw new BadRequestException('Review scene numbers and rows.');
      for (const row of scene.shots) {
        if (
          !row ||
          typeof row !== 'object' ||
          ++count > 5000 ||
          typeof row.number !== 'string' ||
          !row.number.trim()
        )
          throw new BadRequestException(
            'Every imported shot needs a reviewed text identifier (maximum 5000 rows).',
          );
        for (const [key, value] of Object.entries(row))
          if (
            !fields.has(key) ||
            typeof value !== 'string' ||
            value.length > 20000
          )
            throw new BadRequestException('Invalid imported field.');
      }
    }
    const connection = await this.collab!.openDirectConnection(id, { user });
    let result: unknown;
    try {
      await connection.transact((doc) =>
        doc.transact(() => {
          const batches = doc.getMap('imports');
          if (batches.has(payload.batchId!)) {
            result = batches.get(payload.batchId!);
            return;
          }
          const allScenes = doc.getMap<Y.Map<unknown>>('scenes'),
            shots = doc.getMap<Y.Map<unknown>>('shots');
          let sceneOrder = allScenes.size,
            planning = shots.size;
          const narrative = new Set([
            'coverage',
            'notes',
            'focusNotes',
            'lightingNotes',
          ]);
          for (const source of scenes) {
            const sceneId = randomUUID(),
              scene = new Y.Map<unknown>();
            allScenes.set(sceneId, scene);
            scene.set('id', sceneId);
            scene.set('number', source.number);
            scene.set('title', source.title || '');
            scene.set('order', ++sceneOrder * 1024);
            let order = 0;
            for (const row of source.shots) {
              const shotId = randomUUID(),
                shot = new Y.Map<unknown>();
              shots.set(shotId, shot);
              for (const field of narrative)
                shot.set(field, new Y.Text(String(row[field] || '')));
              for (const [key, value] of Object.entries(row))
                if (!narrative.has(key)) shot.set(key, value);
              shot.set('id', shotId);
              shot.set('sceneId', sceneId);
              shot.set('order', ++order * 1024);
              shot.set('planningOrder', ++planning * 1024);
              shot.set('createdAt', new Date().toISOString());
              shot.set('createdBy', user.userID);
              shot.set('deleted', false);
            }
          }
          result = {
            scenes: scenes.length,
            shots: count,
            rejected: 0,
            batchId: payload.batchId,
          };
          batches.set(payload.batchId!, result);
        }, 'import'),
      );
      await this.persist(connection.document!, id);
      return result;
    } finally {
      await connection.disconnect();
    }
  }
  async onModuleDestroy() {
    if (this.recheck) clearInterval(this.recheck);
    await this.collab?.destroy();
    this.sockets?.close();
    if (this.lease) {
      await this.lease.query('SELECT pg_advisory_unlock(1793426400)');
      await this.lease.release();
    }
  }
}
