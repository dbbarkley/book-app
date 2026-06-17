class BackfillFinishedAtForReadBooks < ActiveRecord::Migration[7.0]
  def up
    # Books added directly as 'read' before the create action was fixed never
    # got finished_at set. Fall back to updated_at as the best available proxy.
    UserBook.where(status: 'read', finished_at: nil).find_each do |ub|
      ub.update_columns(finished_at: ub.updated_at)
    end
  end

  def down
    # Non-reversible — we cannot distinguish backfilled from original values
  end
end
