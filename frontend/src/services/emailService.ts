import api, { API_URL } from './api';

interface EmailAttachment {
    name: string;
    attachment: string;
}

interface SendEmailParams {
    emailAuthor: string;
    emailRecipient: string;
    emailCopyRecipient?: string;
    subject: string;
    body: string;
    attachments?: EmailAttachment[];
}

class EmailService {
    private readonly apiUrl = `${API_URL}/email/send`;

    async sendEmail({
        emailAuthor,
        emailRecipient,
        emailCopyRecipient,
        subject,
        body,
        attachments
    }: SendEmailParams): Promise<void> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailAuthor,
                    emailRecipient,
                    emailCopyRecipient,
                    subject,
                    body,
                    attachments
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send email');
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error sending email: ${error.message}`);
            }
            throw new Error('An unknown error occurred while sending the email');
        }
    }

    async convertFileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
}

export const emailService = new EmailService(); 