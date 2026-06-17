class RollbackFinishedAtBackfill < ActiveRecord::Migration[7.0]
  def up
    # Undo the eager backfill: records where finished_at == updated_at were
    # stamped by the migration, not by a real status change. Reset them so the
    # user can correct them manually.
    UserBook
      .where(status: 'read')
      .where('finished_at = updated_at')
      .update_all(finished_at: nil)
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
