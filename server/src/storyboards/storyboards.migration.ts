import type { MigrationInterface, QueryRunner } from 'typeorm';
/** Additive, separate from approved M03 tables. Binary media lives in private object storage. */
export class Storyboards1793512800000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE storyboard_documents (
      id uuid PRIMARY KEY, production text NOT NULL DEFAULT 'whiteout',
      name varchar(180) NOT NULL, creator_id integer NOT NULL,
      state bytea NOT NULL, archived_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE TABLE storyboard_assets (
      id uuid PRIMARY KEY, document_id uuid NOT NULL REFERENCES storyboard_documents(id),
      storage_key text NOT NULL, filename text NOT NULL, mime text NOT NULL,
      bytes bigint NOT NULL, sha256 char(64) NOT NULL, width integer, height integer,
      thumbnail_key text, creator_id integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(document_id,sha256)
    )`);
    await q.query(
      'CREATE INDEX storyboard_assets_document ON storyboard_assets(document_id)',
    );
  }
  async down(q: QueryRunner) {
    await q.query('DROP TABLE storyboard_assets');
    await q.query('DROP TABLE storyboard_documents');
  }
}
