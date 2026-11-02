import { collaborationError } from '../collaboration-error';
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
import { snapshot, metadata, type PrintOptions } from './pdf/shotlist-report';
import type { TablePrintSpec } from './pdf/table-print';
import { renderSpreadsheet } from './pdf/spreadsheet';
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
  // Single-writer process: archive state is loaded once and changed only by management operations.
  private archiveStates = new Map<string, boolean>();
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

  assertProductionMember(user: Collaborator) {
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
    this.assertProductionMember(user);
    if (!uuid.test(id))
      throw new ForbiddenException('Shot list is unavailable.');
    const [row] = await this.db.query(
      this.archiveStates.has(id)
        ? 'SELECT id FROM shot_list_documents WHERE id=$1'
        : 'SELECT id,state FROM shot_list_documents WHERE id=$1',
      [id],
    );
    if (!row) throw new ForbiddenException('Shot list is unavailable.');
    if (!this.archiveStates.has(id)) {
      const state = new Y.Doc();
      try {
        Y.applyUpdate(state, row.state);
        this.archiveStates.set(id, !!state.getMap('meta').get('archivedAt'));
      } finally {
        state.destroy();
      }
    }
    if (this.archiveStates.get(id))
      throw new ForbiddenException('Shot list is archived.');
  }
  async list(user: Collaborator) {
    this.assertProductionMember(user);
    const rows = await this.db.query(
      `SELECT d.id,d.name,d.state,d.created_at AS "createdAt",d.updated_at AS "updatedAt" FROM shot_list_documents d ORDER BY d.updated_at DESC`,
    );
    return {
      items: rows
        .map(({ state, ...row }: { state: Buffer; [key: string]: unknown }) => {
          const doc = new Y.Doc();
          try {
            Y.applyUpdate(doc, state);
            return doc.getMap('meta').get('archivedAt')
              ? null
              : { ...row, ...metadata(snapshot(doc)) };
          } finally {
            doc.destroy();
          }
        })
        .filter(Boolean),
    };
  }
  async create(user: Collaborator, name: unknown, firstDate?: unknown) {
    this.assertProductionMember(user);
    if (typeof name !== 'string' || !name.trim() || name.length > 180)
      throw new BadRequestException('Enter a name of up to 180 characters.');
    if (
      firstDate !== undefined &&
      firstDate !== '' &&
      (typeof firstDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(firstDate) ||
        !Number.isFinite(Date.parse(firstDate + 'T12:00:00Z')) ||
        new Date(firstDate + 'T12:00:00Z').toISOString().slice(0, 10) !==
          firstDate)
    )
      throw new BadRequestException('Choose a valid calendar date.');
    const id = randomUUID(),
      doc = new Y.Doc();
    doc.getMap('meta').set('name', name.trim());
    doc.getMap('meta').set('schemaVersion', 2);
    if (firstDate) {
      const dayId = randomUUID(),
        day = new Y.Map();
      doc.getMap('shootDays').set(dayId, day);
      Object.entries({
        id: dayId,
        date: firstDate,
        title: '',
        order: 1024,
      }).forEach(([k, v]) => day.set(k, v));
    }
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
        role: user.role,
        department: user.department,
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
        try {
          if (!token || token.length > 8192)
            throw new Error('Session required');
          const user = await this.auth.verifySchedulerToken(token);
          await this.authorize(documentName, user);
          return { user, token, checkedAt: Date.now() };
        } catch (error) {
          throw collaborationError(error, 4403);
        }
      },
      beforeHandleMessage: async ({ documentName, context }) => {
        try {
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
        } catch (error) {
          throw collaborationError(error, 4403);
        }
      },
      onLoadDocument: async ({ documentName, document }) => {
        try {
          const [row] = await this.db.query(
            'SELECT state FROM shot_list_documents WHERE id=$1',
            [documentName],
          );
          if (!row) throw new Error('Shot list unavailable');
          Y.applyUpdate(document, row.state);
          return document;
        } catch (error) {
          throw collaborationError(error, 4403);
        }
      },
      onStoreDocument: async ({ documentName, document }) => {
        try {
          try {
            await this.persist(document, documentName);
          } catch (error) {
            document.broadcastStateless(
              JSON.stringify({ type: 'persistence-error' }),
            );
            throw error;
          }
        } catch (error) {
          throw collaborationError(error, 1013);
        }
      },
      onStateless: async ({ payload, document, documentName, connection }) => {
        try {
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
        } catch (error) {
          throw collaborationError(error, 1013);
        }
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
      // Other workspaces authenticate independently before accepting updates.
      if (
        ['/api/storyboards/collaboration', '/api/flows/collaboration'].includes(
          url.pathname,
        )
      )
        return;
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
        shootDays: doc.getMap('shootDays').toJSON(),
        shootAssignments: doc.getMap('shootAssignments').toJSON(),
      };
    } finally {
      await connection.disconnect();
    }
  }
  async manage(
    id: string,
    user: Collaborator,
    payload: { action?: string; name?: string },
  ) {
    this.assertProductionMember(user);
    if (
      !uuid.test(id) ||
      !['rename', 'archive', 'restore'].includes(payload?.action || '')
    )
      throw new BadRequestException('Invalid document action.');
    if (payload.action !== 'restore') await this.authorize(id, user);
    else {
      const [row] = await this.db.query(
        'SELECT id FROM shot_list_documents WHERE id=$1',
        [id],
      );
      if (!row) throw new ForbiddenException('Shot list unavailable.');
    }
    if (
      payload.action === 'rename' &&
      (typeof payload.name !== 'string' ||
        !payload.name.trim() ||
        payload.name.length > 180)
    )
      throw new BadRequestException('Enter a name of up to 180 characters.');
    const connection = await this.collab!.openDirectConnection(id, { user });
    try {
      await connection.transact((doc) => {
        if (payload.action === 'rename')
          doc.getMap('meta').set('name', payload.name!.trim());
        else
          doc
            .getMap('meta')
            .set(
              'archivedAt',
              payload.action === 'archive' ? new Date().toISOString() : null,
            );
      });
      await this.persist(connection.document!, id);
      if (payload.action !== 'rename')
        this.archiveStates.set(id, payload.action === 'archive');
      if (payload.action === 'archive')
        connection.document!.getConnections().forEach((c) => c.close());
      return { ok: true };
    } finally {
      await connection.disconnect();
    }
  }
  async pdf(
    id: string,
    user: Collaborator,
    options: PrintOptions | TablePrintSpec,
  ) {
    await this.authorize(id, user);
    await this.saveQueues.get(id);
    const [row] = await this.db.query(
      'SELECT state FROM shot_list_documents WHERE id=$1',
      [id],
    );
    const doc = new Y.Doc();
    try {
      Y.applyUpdate(doc, row.state);
      return await renderSpreadsheet(snapshot(doc), options as TablePrintSpec);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'PDF generation failed.',
      );
    } finally {
      doc.destroy();
    }
  }
  // Import is a single CRDT transaction on the same authoritative document.
  // It never replaces scenes or writes an independent JSON snapshot.
  async import(
    id: string,
    user: Collaborator,
    payload: { batchId?: string; scenes?: unknown[]; schedule?: unknown },
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
    const schedule = (payload.schedule || []) as Array<{
      date: string;
      title: string;
      rows: {
        number: string;
        sceneNumber?: string;
        notes?: string;
        estimatedMinutes?: string;
      }[];
    }>;
    if (!Array.isArray(schedule) || schedule.length > 100)
      throw new BadRequestException('Invalid schedule references.');
    let assignmentCount = 0;
    for (const day of schedule) {
      if (
        !day ||
        typeof day.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
        !Number.isFinite(Date.parse(day.date + 'T12:00:00Z')) ||
        new Date(day.date + 'T12:00:00Z').toISOString().slice(0, 10) !==
          day.date ||
        typeof day.title !== 'string' ||
        day.title.length > 180 ||
        !Array.isArray(day.rows)
      )
        throw new BadRequestException('Review schedule dates and labels.');
      for (const row of day.rows)
        if (
          !row ||
          ++assignmentCount > 5000 ||
          typeof row.number !== 'string' ||
          !row.number.trim() ||
          row.number.length > 20000 ||
          (row.sceneNumber !== undefined &&
            (typeof row.sceneNumber !== 'string' ||
              row.sceneNumber.length > 80)) ||
          (row.notes !== undefined &&
            (typeof row.notes !== 'string' || row.notes.length > 20000)) ||
          (row.estimatedMinutes !== undefined &&
            (typeof row.estimatedMinutes !== 'string' ||
              row.estimatedMinutes.length > 100 ||
              (row.estimatedMinutes !== '' &&
                (!Number.isFinite(Number(row.estimatedMinutes)) ||
                  Number(row.estimatedMinutes) < 0))))
        )
          throw new BadRequestException('Invalid schedule reference.');
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
          const existing = [...shots.values()]
            .filter(
              (shot) =>
                !shot.get('deleted') &&
                allScenes.has(String(shot.get('sceneId'))) &&
                !allScenes.get(String(shot.get('sceneId')))?.get('deleted'),
            )
            .map((shot) => ({
              number: String(shot.get('number')),
              sceneNumber: String(
                allScenes.get(String(shot.get('sceneId')))?.get('number'),
              ),
              id: String(shot.get('id')),
            }));
          const candidates = [
            ...existing,
            ...scenes.flatMap((scene) =>
              scene.shots.map((shot) => ({
                number: shot.number,
                sceneNumber: scene.number,
                id: '',
              })),
            ),
          ];
          for (const day of schedule)
            for (const row of day.rows) {
              const matches = candidates.filter(
                (c) =>
                  c.number === row.number &&
                  (!row.sceneNumber || c.sceneNumber === row.sceneNumber),
              );
              if (matches.length !== 1)
                throw new BadRequestException(
                  `Schedule shot “${row.number}” has ${matches.length} matches. Review its scene and identifier before importing.`,
                );
            }
          let sceneOrder = Math.max(
              0,
              ...[...allScenes.values()].map(
                (s) => Number(s.get('order')) || 0,
              ),
            ),
            planning = Math.max(
              0,
              ...[...shots.values()].map(
                (s) => Number(s.get('planningOrder')) || 0,
              ),
            );
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
            scene.set('order', (sceneOrder += 1024));
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
              shot.set('planningOrder', (planning += 1024));
              shot.set('createdAt', new Date().toISOString());
              shot.set('createdBy', user.userID);
              shot.set('deleted', false);
              existing.push({
                id: shotId,
                number: String(row.number),
                sceneNumber: source.number,
              });
            }
          }
          for (const source of schedule) {
            const dayId = randomUUID(),
              day = new Y.Map();
            doc.getMap('shootDays').set(dayId, day);
            Object.entries({
              id: dayId,
              date: source.date,
              title: source.title,
              order: doc.getMap('shootDays').size * 1024,
            }).forEach(([k, v]) => day.set(k, v));
            let order = 0;
            const used = new Set<string>();
            for (const row of source.rows) {
              const shot = existing.find(
                (c) =>
                  c.number === row.number &&
                  (!row.sceneNumber || c.sceneNumber === row.sceneNumber),
              )!;
              const assignmentId = randomUUID(),
                assignment = new Y.Map();
              doc.getMap('shootAssignments').set(assignmentId, assignment);
              Object.entries({
                id: assignmentId,
                dayId,
                shotId: shot.id,
                order: (order += 1024),
                notes: row.notes || '',
                estimatedMinutes: row.estimatedMinutes || '',
                status: 'planned',
                pickup: used.has(shot.id),
              }).forEach(([k, v]) => assignment.set(k, v));
              used.add(shot.id);
            }
            doc.getMap('meta').set('schemaVersion', 2);
          }
          result = {
            scenes: scenes.length,
            shots: count,
            rejected: 0,
            assignments: assignmentCount,
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
