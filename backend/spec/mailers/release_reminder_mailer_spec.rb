require 'rails_helper'

RSpec.describe ReleaseReminderMailer, type: :mailer do
  let(:user)    { create(:user, display_name: 'Jane') }
  let(:release1) do
    create(:upcoming_release,
           title:          'The House',
           authors:        ['Donna Tartt'],
           cover_image_url: nil,
           date_published:  Date.tomorrow)
  end
  let(:release2) do
    create(:upcoming_release,
           title:          'A Long Walk',
           authors:        ['Stephen King'],
           cover_image_url: nil,
           date_published:  Date.tomorrow)
  end

  describe '#tomorrow_digest' do
    let(:mail) { described_class.tomorrow_digest(user, [release1, release2]) }

    it 'is sent to the user email' do
      expect(mail.to).to eq([user.email])
    end

    it 'uses the multi-book subject when more than one book' do
      expect(mail.subject).to eq('2 books you\'re watching release tomorrow')
    end

    it 'uses the single-book subject when one book' do
      single = described_class.tomorrow_digest(user, [release1])
      expect(single.subject).to eq('Your book releases tomorrow')
    end

    it 'includes book titles in the body' do
      expect(mail.html_part.body.decoded).to include('The House')
      expect(mail.html_part.body.decoded).to include('A Long Walk')
    end

    it 'includes the text part' do
      expect(mail.text_part.body.decoded).to include('The House')
    end
  end
end
