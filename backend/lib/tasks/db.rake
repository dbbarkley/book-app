namespace :db do
  desc "Create database and run migrations"
  task setup: :environment do
    Rake::Task['db:create'].invoke
    Rake::Task['db:migrate'].invoke
  end
end

