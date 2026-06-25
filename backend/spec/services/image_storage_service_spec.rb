require 'rails_helper'

RSpec.describe ImageStorageService do
  let(:s3_client) { instance_double(Aws::S3::Client) }

  before do
    allow(Aws::S3::Client).to receive(:new).and_return(s3_client)
    stub_const('ENV', ENV.to_h.merge(
      'R2_BUCKET'     => 'test-bucket',
      'R2_PUBLIC_URL' => 'https://pub-test.r2.dev'
    ))
    # Reset memoised client between examples
    described_class.instance_variable_set(:@client, nil)
  end

  describe '.url_for' do
    it 'returns full public URL for a path' do
      expect(described_class.url_for('covers/9780743273565.jpg'))
        .to eq('https://pub-test.r2.dev/covers/9780743273565.jpg')
    end
  end

  describe '.upload' do
    it 'calls put_object with correct params' do
      expect(s3_client).to receive(:put_object).with(
        bucket:        'test-bucket',
        key:           'covers/9780743273565.jpg',
        body:          'image_data',
        content_type:  'image/jpeg',
        cache_control: 'public, max-age=31536000, immutable'
      )
      described_class.upload('covers/9780743273565.jpg', 'image_data', content_type: 'image/jpeg')
    end
  end

  describe '.delete' do
    it 'calls delete_object with correct params' do
      expect(s3_client).to receive(:delete_object).with(
        bucket: 'test-bucket',
        key:    'covers/9780743273565.jpg'
      )
      described_class.delete('covers/9780743273565.jpg')
    end
  end
end
