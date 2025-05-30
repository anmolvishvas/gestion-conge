import { useState } from 'react';
import { emailService } from '../services/emailService';

interface UseEmailReturn {
    sending: boolean;
    error: string | null;
    success: boolean;
    sendEmail: (params: {
        emailAuthor: string;
        emailRecipient: string;
        emailCopyRecipient?: string;
        subject: string;
        body: string;
        files?: File[];
    }) => Promise<void>;
}

export const useEmail = (): UseEmailReturn => {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const sendEmail = async ({
        emailAuthor,
        emailRecipient,
        emailCopyRecipient,
        subject,
        body,
        files
    }: {
        emailAuthor: string;
        emailRecipient: string;
        emailCopyRecipient?: string;
        subject: string;
        body: string;
        files?: File[];
    }) => {
        try {
            setSending(true);
            setError(null);
            setSuccess(false);

            let attachments;
            if (files && files.length > 0) {
                attachments = await Promise.all(
                    files.map(async (file) => ({
                        name: file.name,
                        attachment: await emailService.convertFileToBase64(file)
                    }))
                );
            }

            await emailService.sendEmail({
                emailAuthor,
                emailRecipient,
                emailCopyRecipient,
                subject,
                body,
                attachments
            });

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send email');
            throw err;
        } finally {
            setSending(false);
        }
    };

    return {
        sending,
        error,
        success,
        sendEmail
    };
}; 