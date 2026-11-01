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
export const digest = (d: Y.Doc) =>
  createHash('sha256')
    .update(Y.encodeSnapshot(Y.snapshot(d)))
    .digest('hex');
/** SQL owns document identity/archive and assets. Yjs owns panel/revision/link/comment
 * metadata, order, notes and independent annotation objects; its durable snapshot
 * is stored in SQL. There are no second independently editable copies. */
@Injectable()
export class StoryboardsService implements OnModuleDestroy {
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
  async authorize(id: string, user: Collaborator, allowArchived = false) {
    this.shots.assertProductionMember(user);
    if (!uuid.test(id)) throw new ForbiddenException('Storyboard unavailable.');
    const [row] = await this.db.query(
      "SELECT id,name,archived_at FROM storyboard_documents WHERE id=$1 AND production='whiteout'",
      [id],
    );
    if (!row || (row.archived_at && !allowArchived))
      throw new ForbiddenException('Storyboard unavailable.');
    return row;
  }
  async list(user: Collaborator) {
    this.shots.assertProductionMember(user);
    const rows = await this.db.query(
      'SELECT id,name,state,updated_at AS "updatedAt" FROM storyboard_documents WHERE production=\'whiteout\' AND archived_at IS NULL ORDER BY updated_at DESC,id',
    );
    return {
      items: await Promise.all(
        rows.map(
          async ({
            state,
            ...row
          }: {
            state: Buffer;
            [key: string]: unknown;
          }) => {
            const d = new Y.Doc();
            try {
              Y.applyUpdate(d, state);
              const panels = Object.values(d.getMap('panels').toJSON()).filter(
                (p: any) => !p.deletedAt,
              ) as any[];
              const linkedLists = [
                ...new Set(
                  panels
                    .flatMap((p) => (p.links || []).map((l: any) => l.listId))
                    .concat(d.getMap('meta').get('originatingList') || []),
                ),
              ] as string[];
              const names: string[] = [],
                sceneLabels = new Set<string>();
              for (const listId of linkedLists) {
                try {
                  const data = await this.shots.export(listId, user);
                  names.push(String(data.meta.name || 'Shot List'));
                  for (const panel of panels)
                    for (const link of panel.links || []) {
                      if (link.listId !== listId) continue;
                      const shot = data.shots[link.shotId] as any,
                        scene = shot
                          ? (data.scenes[shot.sceneId] as any)
                          : undefined;
                      if (scene && !scene.deletedAt)
                        sceneLabels.add(String(scene.number));
                    }
                } catch {
                  names.push('Shot List unavailable');
                }
              }
              return {
                ...row,
                linkedListNames: names,
                sceneLabels: [...sceneLabels].sort((a, b) =>
                  a.localeCompare(b, undefined, { numeric: true }),
                ),
                panelCount: panels.length,
                originatingList: d.getMap('meta').get('originatingList'),
                previewAsset:
                  (() => {
                    const p = panels
                      .sort((a, b) => a.order - b.order)
                      .find((p) => p.activeRevision);
                    return p
                      ? (
                          d.getMap('revisions').get(p.activeRevision) as
                            | Y.Map<unknown>
                            | undefined
                        )?.get('assetId')
                      : null;
                  })() || null,
              };
            } finally {
              d.destroy();
            }
          },
        ),
      ),
    };
  }
  async create(
    user: Collaborator,
    payload: {
      id?: string;
      name?: string;
      listId?: string;
      shotIds?: string[];
    },
  ) {
    this.shots.assertProductionMember(user);
    if (
      !payload.name?.trim() ||
      payload.name.length > 180 ||
      !uuid.test(payload.id || '')
    )
      throw new BadRequestException(
        'A valid request ID and title are required.',
      );
    const d = new Y.Doc();
    d.getMap('meta').set('name', payload.name.trim());
    d.getMap('meta').set('schemaVersion', 1);
    try {
      if (payload.listId) {
        const data = await this.shots.export(payload.listId, user);
        d.getMap('meta').set('originatingList', payload.listId);
        const ids = payload.shotIds || [];
        if (ids.length > 2000 || new Set(ids).size !== ids.length)
          throw new BadRequestException('Invalid shot selection.');
        for (const [i, id] of ids.entries()) {
          const shot = data.shots[id] as any;
          if (!shot || shot.deletedAt)
            throw new BadRequestException('A selected shot is unavailable.');
          const panel = new Y.Map(),
            panelId = randomUUID();
          d.getMap('panels').set(panelId, panel);
          Object.entries({
            id: panelId,
            label: '',
            notes: new Y.Text(),
            order: (i + 1) * 1024,
            links: [{ listId: payload.listId, shotId: id }],
          }).forEach(([k, v]) => panel.set(k, v));
        }
      }
      await this.db.query(
        'INSERT INTO storyboard_documents(id,name,creator_id,state) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',
        [
          payload.id,
          payload.name.trim(),
          user.userID,
          Buffer.from(Y.encodeStateAsUpdate(d)),
        ],
      );
      await this.authorize(payload.id!, user);
      return { id: payload.id, name: payload.name.trim() };
    } finally {
      d.destroy();
    }
  }
  async shotLinks(user: Collaborator, listId: string, shotId: string) {
    await this.shots.authorize(listId, user);
    if (!uuid.test(shotId || ''))
      throw new BadRequestException('Invalid shot.');
    const rows = await this.db.query(
        "SELECT id,name,state FROM storyboard_documents WHERE production='whiteout' AND archived_at IS NULL",
      ),
      items: any[] = [];
    for (const row of rows) {
      const doc = new Y.Doc();
      try {
        Y.applyUpdate(doc, row.state);
        for (const value of doc.getMap('panels').values()) {
          const panel = (value as Y.Map<unknown>).toJSON();
          if (
            panel.deletedAt ||
            !Array.isArray(panel.links) ||
            !panel.links.some(
              (l: any) => l.listId === listId && l.shotId === shotId,
            )
          )
            continue;
          const revision = doc.getMap('revisions').get(panel.activeRevision) as
            | Y.Map<unknown>
            | undefined;
          items.push({
            boardId: row.id,
            name: row.name,
            panelId: panel.id,
            label: panel.label,
            assetId: revision?.get('assetId') || null,
          });
        }
      } finally {
        doc.destroy();
      }
    }
    return { items };
  }
  async session(id: string, user: Collaborator) {
    const row = await this.authorize(id, user);
    return {
      id,
      name: row.name,
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
    fn: (doc: Y.Doc) => Promise<T>,
  ) {
    await this.authorize(id, user);
    const c = await this.collab!.openDirectConnection(id, { user });
    try {
      return await fn(c.document!);
    } finally {
      await c.disconnect();
    }
  }
  async snapshot(id: string, user: Collaborator, confirmSaved = false) {
    return this.withDocument(id, user, async (d) => {
      const capture = () =>
        structuredClone({
          meta: d.getMap('meta').toJSON(),
          panels: d.getMap('panels').toJSON(),
          revisions: d.getMap('revisions').toJSON(),
          annotations: d.getMap('annotations').toJSON(),
          comments: d.getMap('comments').toJSON(),
        });
      if (!confirmSaved) return capture();
      let result: ReturnType<typeof capture> | undefined;
      await this.persist(id, d, () => {
        result = capture();
      });
      return result!;
    });
  }
  async shotLabels(
    links: { listId: string; shotId: string }[],
    user: Collaborator,
  ) {
    const labels = [];
    for (const link of links) {
      try {
        const data = await this.shots.export(link.listId, user);
        const shot = data.shots[link.shotId] as any;
        labels.push(
          shot && !shot.deletedAt ? String(shot.number) : 'Shot unavailable',
        );
      } catch {
        labels.push('Shot unavailable');
      }
    }
    return labels.join(' · ');
  }
  async manage(
    id: string,
    user: Collaborator,
    payload: { action?: string; name?: string },
  ) {
    await this.authorize(id, user, true);
    if (
      !['rename', 'archive', 'restore', 'duplicate'].includes(
        payload.action || '',
      )
    )
      throw new BadRequestException('Invalid document action.');
    if (payload.action === 'archive' || payload.action === 'restore') {
      await this.db.query(
        'UPDATE storyboard_documents SET archived_at=$2,updated_at=now() WHERE id=$1',
        [id, payload.action === 'archive' ? new Date() : null],
      );
      if (payload.action === 'archive')
        this.collab?.documents
          .get(id)
          ?.getConnections()
          .forEach((c) => c.close());
      return { id };
    }
    if (payload.action === 'duplicate')
      return this.withDocument(id, user, async (source) => {
        const copy = new Y.Doc(),
          newId = randomUUID();
        try {
          const assets = await this.db.query(
            'SELECT * FROM storyboard_assets WHERE document_id=$1',
            [id],
          );
          const replacements = new Map<string, string>();
          for (const name of ['panels', 'revisions', 'annotations', 'comments'])
            for (const key of source.getMap(name).keys())
              replacements.set(key, randomUUID());
          for (const asset of assets) replacements.set(asset.id, randomUUID());
          const remap = (v: any): any =>
            typeof v === 'string'
              ? replacements.get(v) || v
              : Array.isArray(v)
                ? v.map(remap)
                : v && typeof v === 'object'
                  ? Object.fromEntries(
                      Object.entries(v).map(([k, x]) => [k, remap(x)]),
                    )
                  : v;
          for (const name of [
            'meta',
            'panels',
            'revisions',
            'annotations',
            'comments',
          ])
            for (const [key, value] of source.getMap(name).entries()) {
              if (value instanceof Y.Map) {
                const map = new Y.Map();
                copy.getMap(name).set(replacements.get(key) || key, map);
                Object.entries(remap(value.toJSON())).forEach(([k, v]) =>
                  map.set(k, v),
                );
              } else copy.getMap(name).set(key, remap(value));
            }
          copy
            .getMap('meta')
            .set(
              'name',
              (String(source.getMap('meta').get('name')) + ' — copy').slice(
                0,
                180,
              ),
            );
          await this.db.transaction(async (manager) => {
            await manager.query(
              'INSERT INTO storyboard_documents(id,name,creator_id,state) VALUES($1,$2,$3,$4)',
              [
                newId,
                copy.getMap('meta').get('name'),
                user.userID,
                Buffer.from(Y.encodeStateAsUpdate(copy)),
              ],
            );
            for (const a of assets)
              await manager.query(
                'INSERT INTO storyboard_assets(id,document_id,storage_key,filename,mime,bytes,sha256,width,height,thumbnail_key,creator_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
                [
                  replacements.get(a.id),
                  newId,
                  a.storage_key,
                  a.filename,
                  a.mime,
                  a.bytes,
                  a.sha256,
                  a.width,
                  a.height,
                  a.thumbnail_key,
                  user.userID,
                ],
              );
          });
          return { id: newId };
        } finally {
          copy.destroy();
        }
      });
    if (!payload.name?.trim() || payload.name.length > 180)
      throw new BadRequestException('Enter a title up to 180 characters.');
    return this.withDocument(id, user, async (d) => {
      d.getMap('meta').set('name', payload.name!.trim());
      await this.persist(id, d);
      return { id };
    });
  }
  private async persist(
    id: string,
    d: Y.Doc & { broadcastStateless?: (s: string) => void },
    capture?: () => void,
  ) {
    const next = (this.queues.get(id) || Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const state = Buffer.from(Y.encodeStateAsUpdate(d)),
          name = String(
            d.getMap('meta').get('name') || 'Untitled storyboard',
          ).slice(0, 180),
          hash = digest(d);
        capture?.();
        await this.db.query(
          'UPDATE storyboard_documents SET state=$2,name=$3,updated_at=now() WHERE id=$1 AND (state IS DISTINCT FROM $2 OR name IS DISTINCT FROM $3)',
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
      'SELECT pg_try_advisory_lock(1793512800) AS acquired',
    );
    if (!lock.acquired)
      throw new Error('Only one Storyboards collaboration replica may run.');
    this.collab = new Hocuspocus({
      name: 'Whiteout Storyboards',
      quiet: true,
      debounce: 250,
      maxDebounce: 1500,
      stopOnSignals: false,
      onAuthenticate: async ({ token, documentName }) => {
        if (!token || token.length > 8192) throw new Error('Session required');
        const user = await this.auth.verifySchedulerToken(token);
        await this.authorize(documentName, user);
        return { user, token, checkedAt: Date.now() };
      },
      beforeHandleMessage: async ({ context, documentName }) => {
        if (Date.now() - context.checkedAt > 30000) {
          const user = await this.auth.verifySchedulerToken(context.token);
          if (user.userID !== context.user.userID)
            throw new Error('Session changed');
          context.user = user;
          context.checkedAt = Date.now();
        }
        await this.authorize(documentName, context.user);
      },
      onLoadDocument: async ({ documentName, document }) => {
        const [row] = await this.db.query(
          'SELECT state FROM storyboard_documents WHERE id=$1',
          [documentName],
        );
        if (!row) throw new Error('Unavailable');
        Y.applyUpdate(document, row.state);
        return document;
      },
      onStoreDocument: async ({ documentName, document }) => {
        try {
          await this.persist(documentName, document);
        } catch (e) {
          document.broadcastStateless(
            JSON.stringify({ type: 'persistence-error' }),
          );
          throw e;
        }
      },
      onStateless: async ({ payload, documentName, document, connection }) => {
        if (payload !== 'persistence-status') return;
        await this.persist(documentName, document);
        connection.sendStateless(
          JSON.stringify({ type: 'persisted', digest: digest(document) }),
        );
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
      if (url.pathname !== '/api/storyboards/collaboration') return;
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
