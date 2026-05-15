class AddPagesToUpcomingReleases < ActiveRecord::Migration[7.1]
  def change
    add_column :upcoming_releases, :pages, :integer
  end
end
