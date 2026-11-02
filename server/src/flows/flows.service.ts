import { collaborationError } from '../collaboration-error';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import * as Y from 'yjs';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';
import type { Server as HttpServer } from 'http';
import { ShotlistsService, Collaborator } from '../shotlists/shotlists.service';
import { AuthService } from '../auth/auth.service';
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const digest = (d: Y.Doc) =>
  createHash('sha256')
    .update(Y.encodeSnapshot(Y.snapshot(d)))
    .digest('hex');
import {
  DEFAULT_DEPARTMENTS,
  capture,
  setRecord,
  validateFlow,
  validateMeta,
} from './model';
/** Flow-specific data only. M03 technical fields are resolved from its authorized live document. */
@Injectable()
export class FlowsService implements OnModuleDestroy {
  private collab?: Hocuspocus;
  private sockets?: WebSocketServer;
  private recheck?: ReturnType<typeof setInterval>;
  private queues = new Map<string, Promise<void>>();
  private lease?: ReturnType<DataSource['createQueryRunner']>;
  constructor(
    private readonly db: DataSource,
    private readonly shots: ShotlistsService,
    private readonly auth: AuthService,
  ) {}
  async authorize(id: string, user: Collaborator, archived = false) {
    this.shots.assertProductionMember(user);
    if (!uuid.test(id)) throw new ForbiddenException('Flow unavailable.');
    const [row] = await this.db.query(
      "SELECT id,name,archived_at FROM flow_documents WHERE id=$1 AND production='whiteout'",
      [id],
    );
    if (!row || (row.archived_at && !archived))
      throw new ForbiddenException('Flow unavailable.');
    return row;
  }
  async list(user: Collaborator) {
    this.shots.assertProductionMember(user);
    const rows = await this.db.query(
      'SELECT id,name,state,updated_at AS "updatedAt" FROM flow_documents WHERE production=\'whiteout\' AND archived_at IS NULL ORDER BY updated_at DESC,id',
    );
    return {
      items: rows.map(({ state, ...row }: any) => {
        const d = new Y.Doc();
        try {
          Y.applyUpdate(d, state);
          const meta = d.getMap('meta').toJSON();
          return {
            ...row,
            ...meta,
            eventCount: [...d.getMap<Y.Map<unknown>>('events').values()].filter(
              (e) => !e.get('deletedAt'),
            ).length,
          };
        } finally {
          d.destroy();
        }
      }),
    };
  }
  async create(user: Collaborator, p: any) {
    this.shots.assertProductionMember(user);
    if (
      !uuid.test(p?.id || '') ||
      typeof p.name !== 'string' ||
      !p.name.trim() ||
      p.name.length > 180
    )
      throw new BadRequestException(
        'A request ID and title up to 180 characters are required.',
      );
    const d = new Y.Doc();
    try {
      Object.entries({
        name: p.name.trim(),
        schemaVersion: 1,
        date: p.date || '',
        zone: p.zone || 'America/Los_Angeles',
        status: 'draft',
        author: user.name,
      }).forEach(([k, v]) => d.getMap('meta').set(k, v));
      validateMeta(d.getMap('meta').toJSON());
      DEFAULT_DEPARTMENTS.forEach((name, i) =>
        setRecord(d, 'departments', randomUUID(), {
          name,
          order: (i + 1) * 1024,
          personnel: '',
          group: '',
        }),
      );
      if (p.listId) {
        const source = await this.shots.export(p.listId, user);
        if (!Array.isArray(p.shotIds) || p.shotIds.length > 3000)
          throw new BadRequestException('Choose valid shots.');
        d.getMap('meta').set('listId', p.listId);
        for (const [i, id] of p.shotIds.entries()) {
          const shot: any = source.shots[id];
          if (!shot || shot.deleted || shot.deletedAt)
            throw new BadRequestException('A selected shot is unavailable.');
          setRecord(d, 'events', randomUUID(), {
            type: 'shot',
            shotId: id,
            sourceListId: p.listId,
            reference: String(shot.number || ''),
            order: (i + 1) * 1024,
            description: '',
            duration: null,
            start: null,
            status: 'planned',
            fixed: false,
          });
        }
      }
      await this.db.query(
        'INSERT INTO flow_documents(id,name,creator_id,state) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',
        [
          p.id,
          p.name.trim(),
          user.userID,
          Buffer.from(Y.encodeStateAsUpdate(d)),
        ],
      );
      await this.authorize(p.id, user);
      return { id: p.id };
    } finally {
      d.destroy();
    }
  }
  async session(id: string, user: Collaborator) {
    const row = await this.authorize(id, user);
    return {
      ...row,
      user: {
        id: user.userID,
        name: user.name,
        role: user.role,
        color: ['#87d8ff', '#d9b8ff', '#a4d6b3', '#f5c48b'][user.userID % 4],
      },
    };
  }
  async withDocument<T>(
    id: string,
    user: Collaborator,
    fn: (d: Y.Doc) => Promise<T>,
  ) {
    await this.authorize(id, user);
    const c = await this.collab!.openDirectConnection(id, { user });
    try {
      return await fn(c.document!);
    } finally {
      await c.disconnect();
    }
  }
  async snapshot(id: string, user: Collaborator) {
    return this.withDocument(id, user, async (d) => {
      await this.persist(id, d);
      return capture(d);
    });
  }
  async resolved(id: string, user: Collaborator) {
    const state = await this.snapshot(id, user);
    let source: any = null;
    if (state.meta.listId) {
      try {
        source = await this.shots.export(String(state.meta.listId), user);
      } catch {
        source = null;
      }
    }
    return { state, source };
  }
  async manage(id: string, user: Collaborator, p: any) {
    await this.authorize(id, user, true);
    if (p.action === 'archive' || p.action === 'restore') {
      await this.db.query(
        'UPDATE flow_documents SET archived_at=$2,updated_at=now() WHERE id=$1',
        [id, p.action === 'archive' ? new Date() : null],
      );
      if (p.action === 'archive')
        this.collab?.documents
          .get(id)
          ?.getConnections()
          .forEach((c) => c.close());
      return { id };
    }
    return this.withDocument(id, user, async (d) => {
      if (p.action === 'rename') {
        if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 180)
          throw new BadRequestException('Enter a title up to 180 characters.');
        d.getMap('meta').set('name', p.name.trim());
        await this.persist(id, d);
        return { id };
      }
      if (p.action === 'duplicate') {
        const next = randomUUID(),
          copy = new Y.Doc();
        try {
          Y.applyUpdate(copy, Y.encodeStateAsUpdate(d));
          copy.transact(() => {
            const meta = copy.getMap('meta');
            meta.set(
              'name',
              (String(meta.get('name')) + ' — copy').slice(0, 180),
            );
            meta.set('date', '');
            meta.set('status', 'draft');
            meta.set('author', user.name);
            for (const k of ['comments', 'history', 'imports'])
              copy.getMap(k).clear();
            for (const v of copy.getMap<Y.Map<unknown>>('events').values()) {
              v.set('start', null);
              v.set('actualStart', null);
              v.set('actualEnd', null);
              v.set('status', 'planned');
            }
          });
          await this.db.query(
            'INSERT INTO flow_documents(id,name,creator_id,state) VALUES($1,$2,$3,$4)',
            [
              next,
              copy.getMap('meta').get('name'),
              user.userID,
              Buffer.from(Y.encodeStateAsUpdate(copy)),
            ],
          );
          return { id: next };
        } finally {
          copy.destroy();
        }
      }
      if (p.action === 'checkpoint') {
        await this.checkpoint(
          id,
          user,
          d,
          String(p.summary || 'Saved revision'),
        );
        return { id };
      }
      if (p.action === 'restoreRevision') {
        const [row] = await this.db.query(
          'SELECT state FROM flow_revisions WHERE id=$1 AND document_id=$2',
          [p.revisionId, id],
        );
        if (!row) throw new BadRequestException('Revision unavailable.');
        await this.checkpoint(id, user, d, 'Before restoration');
        const old = new Y.Doc();
        try {
          Y.applyUpdate(old, row.state);
          d.transact(() => {
            for (const k of [
              'meta',
              'departments',
              'events',
              'instructions',
              'comments',
              'imports',
            ]) {
              d.getMap(k).clear();
              for (const [key, v] of old.getMap(k))
                d.getMap(k).set(
                  key,
                  v instanceof Y.AbstractType ? v.clone() : v,
                );
            }
          }, 'restore');
          await this.persist(id, d);
          return { id };
        } finally {
          old.destroy();
        }
      }
      throw new BadRequestException('Invalid Flow action.');
    });
  }
  private async checkpoint(
    id: string,
    user: Collaborator,
    d: Y.Doc,
    summary: string,
  ) {
    await this.db.query(
      'INSERT INTO flow_revisions(id,document_id,state,author,summary) VALUES($1,$2,$3,$4,$5)',
      [
        randomUUID(),
        id,
        Buffer.from(Y.encodeStateAsUpdate(d)),
        user.name,
        summary.slice(0, 300),
      ],
    );
  }
  async revisions(id: string, user: Collaborator, revision?: string) {
    await this.authorize(id, user);
    if (revision) {
      const [row] = await this.db.query(
        'SELECT state FROM flow_revisions WHERE document_id=$1 AND id=$2',
        [id, revision],
      );
      if (!row) throw new BadRequestException('Revision unavailable.');
      const d = new Y.Doc();
      try {
        Y.applyUpdate(d, row.state);
        return capture(d);
      } finally {
        d.destroy();
      }
    }
    return {
      items: await this.db.query(
        'SELECT id,author,summary,created_at AS \"createdAt\" FROM flow_revisions WHERE document_id=$1 ORDER BY created_at DESC,id',
        [id],
      ),
    };
  }
  async recordPrint(
    id: string,
    user: Collaborator,
    state: any,
    settings: any,
    bytes: Buffer,
  ) {
    await this.authorize(id, user);
    const key = createHash('sha256')
      .update(JSON.stringify({ state, settings }))
      .digest('hex');
    await this.db.query(
      'INSERT INTO flow_prints(id,document_id,digest,settings,snapshot,pdf,creator_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(document_id,digest) DO NOTHING',
      [
        randomUUID(),
        id,
        key,
        JSON.stringify(settings),
        JSON.stringify(state),
        bytes,
        user.userID,
      ],
    );
    return key;
  }
  async printArtifact(id: string, key: string, user: Collaborator) {
    await this.authorize(id, user);
    const [r] = await this.db.query(
      'SELECT pdf FROM flow_prints WHERE document_id=$1 AND digest=$2',
      [id, key],
    );
    if (!r) throw new BadRequestException('Print snapshot unavailable.');
    return r.pdf as Buffer;
  }
  private async persist(
    id: string,
    d: Y.Doc & { broadcastStateless?: (s: string) => void },
    afterCapture?: () => void,
  ) {
    const next = (this.queues.get(id) || Promise.resolve())
      .catch(() => {})
      .then(async () => {
        validateFlow(capture(d));
        const state = Buffer.from(Y.encodeStateAsUpdate(d)),
          name = String(d.getMap('meta').get('name') || 'Untitled Flow').slice(
            0,
            180,
          ),
          hash = digest(d);
        afterCapture?.();
        await this.db.query(
          'UPDATE flow_documents SET state=$2,name=$3,updated_at=now() WHERE id=$1 AND (state IS DISTINCT FROM $2 OR name IS DISTINCT FROM $3)',
          [id, state, name],
        );
        d.broadcastStateless?.(
          JSON.stringify({ type: 'persisted', digest: hash }),
        );
      });
    this.queues.set(id, next);
    try {
      await next;
    } finally {
      if (this.queues.get(id) === next) this.queues.delete(id);
    }
  }
  async attach(http: HttpServer) {
    this.lease = this.db.createQueryRunner();
    await this.lease.connect();
    const [lock] = await this.lease.query(
      'SELECT pg_try_advisory_lock(1793685600) AS acquired',
    );
    if (!lock.acquired)
      throw new Error('Only one Flow collaboration replica may run.');
    this.collab = new Hocuspocus({
      name: 'Whiteout Flow',
      quiet: true,
      debounce: 250,
      maxDebounce: 1500,
      stopOnSignals: false,
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
      beforeHandleMessage: async ({ context, documentName }) => {
        try {
          if (Date.now() - context.checkedAt > 30000) {
            const user = await this.auth.verifySchedulerToken(context.token);
            if (user.userID !== context.user.userID)
              throw new Error('Session changed');
            context.user = user;
            context.checkedAt = Date.now();
          }
          await this.authorize(documentName, context.user);
        } catch (error) {
          throw collaborationError(error, 4403);
        }
      },
      onLoadDocument: async ({ documentName, document }) => {
        try {
          const [row] = await this.db.query(
            'SELECT state FROM flow_documents WHERE id=$1',
            [documentName],
          );
          if (!row) throw new Error('Unavailable');
          Y.applyUpdate(document, row.state);
          return document;
        } catch (error) {
          throw collaborationError(error, 4403);
        }
      },
      onStoreDocument: async ({ documentName, document }) => {
        try {
          try {
            await this.persist(documentName, document);
          } catch (e) {
            document.broadcastStateless(
              JSON.stringify({ type: 'persistence-error' }),
            );
            throw e;
          }
        } catch (error) {
          throw collaborationError(error, 1013);
        }
      },
      onStateless: async ({ payload, documentName, document, connection }) => {
        try {
          if (payload !== 'persistence-status') return;
          await this.persist(documentName, document);
          connection.sendStateless(
            JSON.stringify({ type: 'persisted', digest: digest(document) }),
          );
        } catch (error) {
          throw collaborationError(error, 1013);
        }
      },
    });
    this.recheck = setInterval(() => {
      for (const doc of this.collab!.documents.values())
        for (const c of doc.getConnections())
          void (async () => {
            const user = await this.auth.verifySchedulerToken(c.context.token);
            if (user.userID !== c.context.user.userID) throw new Error();
            await this.authorize(doc.name, user);
            c.context.user = user;
            c.context.checkedAt = Date.now();
          })().catch(() =>
            c.close({ code: 4403, reason: 'Session or membership revoked' }),
          );
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
      if (url.pathname !== '/api/flows/collaboration') return;
      if (url.search || !origins.has(request.headers.origin || '')) {
        socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }
      this.sockets!.handleUpgrade(request, socket, head, (ws) =>
        this.collab!.handleConnection(ws, request),
      );
    });
  }
  async onModuleDestroy() {
    if (this.recheck) clearInterval(this.recheck);
    await this.collab?.destroy();
    this.sockets?.close();
    await Promise.allSettled(this.queues.values());
    await this.lease?.release();
  }
}
