# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_12_29_150000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "authors", force: :cascade do |t|
    t.string "name", null: false
    t.text "bio"
    t.string "avatar_url"
    t.string "website_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_authors_on_name"
  end

  create_table "books", force: :cascade do |t|
    t.string "title", null: false
    t.string "isbn"
    t.text "description"
    t.string "cover_image_url"
    t.date "release_date", null: false
    t.bigint "author_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "google_books_id"
    t.integer "cover_image_quality", default: 0
    t.string "cover_image_source"
    t.datetime "cover_last_enriched_at"
    t.jsonb "categories", default: []
    t.index ["author_id"], name: "index_books_on_author_id"
    t.index ["categories"], name: "index_books_on_categories", using: :gin
    t.index ["cover_image_quality"], name: "index_books_on_cover_image_quality"
    t.index ["cover_last_enriched_at"], name: "index_books_on_cover_last_enriched_at"
    t.index ["google_books_id"], name: "index_books_on_google_books_id", unique: true, where: "(google_books_id IS NOT NULL)"
    t.index ["isbn"], name: "index_books_on_isbn", unique: true, where: "(isbn IS NOT NULL)"
    t.index ["release_date"], name: "index_books_on_release_date"
    t.index ["title", "author_id"], name: "index_books_on_title_and_author_id"
  end

  create_table "event_authors", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "author_id", null: false
    t.float "confidence_score", default: 1.0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_event_authors_on_author_id"
    t.index ["event_id"], name: "index_event_authors_on_event_id"
  end

  create_table "events", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.string "event_type", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at"
    t.string "location"
    t.bigint "author_id"
    t.bigint "book_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_virtual", default: false, null: false
    t.string "venue_name"
    t.string "external_url"
    t.string "external_source"
    t.string "timezone"
    t.datetime "last_refreshed_at"
    t.bigint "venue_id"
    t.string "external_id"
    t.string "status", default: "upcoming"
    t.string "image_url"
    t.string "audience_type"
    t.index ["audience_type"], name: "index_events_on_audience_type"
    t.index ["author_id"], name: "index_events_on_author_id"
    t.index ["book_id"], name: "index_events_on_book_id"
    t.index ["event_type", "starts_at"], name: "index_events_on_event_type_and_starts_at"
    t.index ["external_source", "external_id"], name: "index_events_on_external_source_and_external_id", unique: true
    t.index ["external_source"], name: "index_events_on_external_source"
    t.index ["is_virtual"], name: "index_events_on_is_virtual"
    t.index ["last_refreshed_at"], name: "index_events_on_last_refreshed_at"
    t.index ["starts_at", "ends_at"], name: "index_events_on_starts_at_and_ends_at"
    t.index ["starts_at"], name: "index_events_on_starts_at"
    t.index ["status"], name: "index_events_on_status"
    t.index ["venue_id"], name: "index_events_on_venue_id"
  end

  create_table "feed_items", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "feedable_type", null: false
    t.bigint "feedable_id", null: false
    t.string "activity_type", null: false
    t.jsonb "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_feed_items_on_created_at"
    t.index ["feedable_type", "feedable_id"], name: "index_feed_items_on_feedable"
    t.index ["user_id", "activity_type", "created_at"], name: "index_feed_items_user_activity_created"
    t.index ["user_id", "created_at"], name: "index_feed_items_user_created"
    t.index ["user_id"], name: "index_feed_items_on_user_id"
  end

  create_table "follows", force: :cascade do |t|
    t.bigint "follower_id", null: false
    t.string "followable_type", null: false
    t.bigint "followable_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["followable_type", "followable_id", "created_at"], name: "index_follows_on_followable_and_created_at"
    t.index ["followable_type", "followable_id"], name: "index_follows_on_followable_type_and_followable_id"
    t.index ["follower_id", "followable_type", "followable_id"], name: "index_follows_unique", unique: true
    t.index ["follower_id"], name: "index_follows_on_follower_id"
  end

  create_table "forum_follows", force: :cascade do |t|
    t.bigint "forum_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["forum_id", "user_id"], name: "index_forum_follows_on_forum_id_and_user_id", unique: true
    t.index ["forum_id"], name: "index_forum_follows_on_forum_id"
    t.index ["user_id"], name: "index_forum_follows_on_user_id"
  end

  create_table "forum_hearts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "heartable_type", null: false
    t.bigint "heartable_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["heartable_type", "heartable_id"], name: "index_forum_hearts_on_heartable"
    t.index ["user_id", "heartable_type", "heartable_id"], name: "index_forum_hearts_on_user_and_heartable", unique: true
    t.index ["user_id"], name: "index_forum_hearts_on_user_id"
  end

  create_table "forum_posts", force: :cascade do |t|
    t.bigint "forum_id", null: false
    t.bigint "user_id", null: false
    t.text "body", null: false
    t.datetime "edited_at"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_forum_posts_on_deleted_at"
    t.index ["forum_id"], name: "index_forum_posts_on_forum_id"
    t.index ["user_id"], name: "index_forum_posts_on_user_id"
  end

  create_table "forum_replies", force: :cascade do |t|
    t.bigint "forum_post_id", null: false
    t.bigint "user_id", null: false
    t.text "body", null: false
    t.datetime "edited_at"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "parent_id"
    t.index ["deleted_at"], name: "index_forum_replies_on_deleted_at"
    t.index ["forum_post_id"], name: "index_forum_replies_on_forum_post_id"
    t.index ["parent_id"], name: "index_forum_replies_on_parent_id"
    t.index ["user_id"], name: "index_forum_replies_on_user_id"
  end

  create_table "forum_reports", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "reportable_type", null: false
    t.bigint "reportable_id", null: false
    t.string "reason", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["reportable_type", "reportable_id"], name: "index_forum_reports_on_reportable"
    t.index ["user_id", "reportable_type", "reportable_id"], name: "index_forum_reports_on_user_and_reportable", unique: true
    t.index ["user_id"], name: "index_forum_reports_on_user_id"
  end

  create_table "forums", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.integer "visibility", default: 0
    t.bigint "owner_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_forums_on_owner_id"
  end

  create_table "imports", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "source", null: false
    t.string "status", default: "pending", null: false
    t.string "filename"
    t.integer "total_books", default: 0
    t.integer "processed_books", default: 0
    t.integer "successful_imports", default: 0
    t.integer "failed_imports", default: 0
    t.jsonb "metadata", default: {}
    t.text "error_message"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_imports_on_created_at"
    t.index ["user_id", "status"], name: "index_imports_on_user_id_and_status"
    t.index ["user_id"], name: "index_imports_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "notifiable_type", null: false
    t.bigint "notifiable_id", null: false
    t.string "notification_type", null: false
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["user_id", "notification_type", "created_at"], name: "index_notifications_user_type_created"
    t.index ["user_id", "read_at", "created_at"], name: "index_notifications_user_read_created"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "processed_locations", force: :cascade do |t|
    t.string "city"
    t.string "state"
    t.string "zipcode"
    t.datetime "last_searched_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["city", "state"], name: "index_processed_locations_on_city_and_state"
    t.index ["last_searched_at"], name: "index_processed_locations_on_last_searched_at"
    t.index ["zipcode"], name: "index_processed_locations_on_zipcode"
  end

  create_table "user_books", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "book_id", null: false
    t.string "shelf", null: false
    t.integer "pages_read"
    t.integer "total_pages"
    t.integer "completion_percentage", default: 0
    t.integer "rating"
    t.text "review"
    t.datetime "started_at"
    t.datetime "finished_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "to_read", null: false
    t.string "visibility", default: "public", null: false
    t.string "dnf_reason"
    t.integer "dnf_page"
    t.index ["book_id"], name: "index_user_books_on_book_id"
    t.index ["status"], name: "index_user_books_on_status"
    t.index ["user_id", "book_id"], name: "index_user_books_on_user_id_and_book_id", unique: true
    t.index ["user_id", "shelf"], name: "index_user_books_on_user_id_and_shelf"
    t.index ["user_id"], name: "index_user_books_on_user_id"
    t.index ["visibility"], name: "index_user_books_on_visibility"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "username", null: false
    t.string "password_digest", null: false
    t.string "display_name"
    t.text "bio"
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "onboarding_completed", default: false, null: false
    t.jsonb "preferences", default: {}, null: false
    t.string "zipcode"
    t.string "provider"
    t.string "uid"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["onboarding_completed"], name: "index_users_on_onboarding_completed"
    t.index ["preferences"], name: "index_users_on_preferences", using: :gin
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "venues", force: :cascade do |t|
    t.string "name", null: false
    t.string "venue_type", default: "other"
    t.string "address"
    t.string "city"
    t.string "state"
    t.string "zipcode"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.string "website_url"
    t.string "source"
    t.string "external_id"
    t.boolean "active", default: true
    t.datetime "last_fetched_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_venues_on_active"
    t.index ["city", "state"], name: "index_venues_on_city_and_state"
    t.index ["source", "external_id"], name: "index_venues_on_source_and_external_id", unique: true
    t.index ["zipcode"], name: "index_venues_on_zipcode"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "books", "authors"
  add_foreign_key "event_authors", "authors"
  add_foreign_key "event_authors", "events"
  add_foreign_key "events", "authors"
  add_foreign_key "events", "books"
  add_foreign_key "events", "venues"
  add_foreign_key "feed_items", "users"
  add_foreign_key "follows", "users", column: "follower_id"
  add_foreign_key "forum_follows", "forums"
  add_foreign_key "forum_follows", "users"
  add_foreign_key "forum_hearts", "users"
  add_foreign_key "forum_posts", "forums"
  add_foreign_key "forum_posts", "users"
  add_foreign_key "forum_replies", "forum_posts"
  add_foreign_key "forum_replies", "users"
  add_foreign_key "forum_reports", "users"
  add_foreign_key "forums", "users", column: "owner_id"
  add_foreign_key "imports", "users"
  add_foreign_key "user_books", "books"
  add_foreign_key "user_books", "users"
end
