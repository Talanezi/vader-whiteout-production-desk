import { MigrationInterface, QueryRunner } from 'typeorm';

/** Additive only. Existing call sheets, roster and Scheduler data are untouched. */
export class ShotLists1793426400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE shot_list_documents (
      id uuid PRIMARY KEY, name varchar(180) NOT NULL,
      owner_user_id bigint NOT NULL, state bytea NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE TABLE shot_list_members (
      document_id uuid NOT NULL REFERENCES shot_list_documents(id) ON DELETE CASCADE,
      user_id bigint NOT NULL, PRIMARY KEY(document_id, user_id)
    )`);
    await q.query(
      'CREATE INDEX shot_list_member_lookup ON shot_list_members(user_id)',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE shot_list_members');
    await q.query('DROP TABLE shot_list_documents');
  }
}
