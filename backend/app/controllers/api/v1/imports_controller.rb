# frozen_string_literal: true

require 'csv'

module Api
  module V1
    # ImportsController handles Goodreads/StoryGraph CSV imports
    #
    # Why CSV import instead of direct login:
    # - Goodreads does not provide a public API for user data
    # - OAuth is deprecated and no longer available for new apps
    # - Scraping with user credentials would violate Goodreads ToS
    # - CSV export is the only officially supported way to get user data
    #
    # Future expansion:
    # - StoryGraph CSV import can be added with minimal changes
    # - Same controller/job pattern, just different CSV parsing logic
    class ImportsController < BaseController

      # POST /api/v1/imports/goodreads
      # Accepts CSV file and creates an import job
      #
      # Idempotency: Multiple imports are allowed, each creates a new Import record
      # This allows users to re-import if they've updated their Goodreads library
      def create
        unless params[:file].present?
          return render json: { error: 'CSV file is required' }, status: :unprocessable_entity
        end

        file = params[:file]
        
        # Validate file type
        unless file.content_type == 'text/csv' || file.original_filename.end_with?('.csv')
          return render json: { error: 'File must be a CSV' }, status: :unprocessable_entity
        end

        # Validate file size (max 10MB)
        if file.size > 10.megabytes
          return render json: { error: 'File size must be less than 10MB' }, status: :unprocessable_entity
        end

        # Read and validate CSV content
        begin
          csv_content = file.read.force_encoding('UTF-8')
          
          # Basic CSV validation
          csv_data = CSV.parse(csv_content, headers: true)
          
          # Validate Goodreads CSV format
          required_headers = ['Title', 'Author']
          unless required_headers.all? { |h| csv_data.headers.include?(h) }
            return render json: { 
              error: 'Invalid Goodreads CSV format. Please export from Goodreads directly.' 
            }, status: :unprocessable_entity
          end

          total_books = csv_data.length

          if total_books.zero?
            return render json: { error: 'CSV file is empty' }, status: :unprocessable_entity
          end

          # Create import record
          import = current_user.imports.create!(
            source: Import::GOODREADS,
            status: Import::PENDING,
            filename: file.original_filename,
            total_books: total_books,
            metadata: {
              file_size: file.size,
              uploaded_at: Time.current
            }
          )

          # Store CSV content temporarily (in production, use cloud storage like S3)
          # For now, we'll pass the CSV content directly to the job
          # In production: store in S3/GCS and pass the URL
          temp_path = Rails.root.join('tmp', 'imports', "#{import.id}_#{file.original_filename}")
          FileUtils.mkdir_p(temp_path.dirname)
          File.write(temp_path, csv_content)

          # Enqueue background job
          ProcessGoodreadsImportJob.perform_later(import.id, temp_path.to_s)

          render json: {
            import: import.summary,
            message: 'Import started successfully'
          }, status: :created

        rescue CSV::MalformedCSVError => e
          render json: { error: "Invalid CSV format: #{e.message}" }, status: :unprocessable_entity
        rescue StandardError => e
          Rails.logger.error("Import creation failed: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          render json: { error: 'Failed to process import' }, status: :internal_server_error
        end
      end

      # GET /api/v1/imports/:id
      # Returns the status and progress of an import
      def show
        import = current_user.imports.find(params[:id])
        render json: { import: import.summary }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Import not found' }, status: :not_found
      end

      # GET /api/v1/imports
      # Returns all imports for the current user
      def index
        imports = current_user.imports.recent.limit(50)
        render json: {
          imports: imports.map(&:summary)
        }
      end
    end
  end
end

