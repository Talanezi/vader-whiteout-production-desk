import type { MigrationInterface, QueryRunner } from 'typeorm';
export class Flows1793685600000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE flow_documents(id uuid PRIMARY KEY, production text NOT NULL DEFAULT 'whiteout', name varchar(180) NOT NULL,creator_id integer NOT NULL,state bytea NOT NULL,archived_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE flow_revisions(id uuid PRIMARY KEY,document_id uuid NOT NULL REFERENCES flow_documents(id),state bytea NOT NULL,author text NOT NULL,summary text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX flow_revisions_document ON flow_revisions(document_id,created_at);
CREATE TABLE flow_sources(id uuid PRIMARY KEY,document_id uuid NOT NULL REFERENCES flow_documents(id),storage_key text NOT NULL,filename text NOT NULL,sha256 text NOT NULL,bytes integer NOT NULL,creator_id integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(document_id,sha256));
CREATE TABLE flow_prints(id uuid PRIMARY KEY,document_id uuid NOT NULL REFERENCES flow_documents(id),digest text NOT NULL,settings jsonb NOT NULL,snapshot jsonb NOT NULL,pdf bytea NOT NULL,creator_id integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(document_id,digest));`);
  }
  async down() {
    throw new Error(
      'Flow rollback requires explicit data-preservation review.',
    );
  }
}
