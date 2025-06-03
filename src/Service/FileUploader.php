<?php

namespace App\Service;

use App\Entity\User;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;

class FileUploader
{
    private string $targetDirectory;
    private SluggerInterface $slugger;

    public function __construct(string $targetDirectory, SluggerInterface $slugger)
    {
        $this->targetDirectory = $targetDirectory;
        $this->slugger = $slugger;
    }

    public function upload(UploadedFile $file): string
    {
        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $fileName = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

        try {
            $file->move($this->getTargetDirectory(), $fileName);
        } catch (FileException $e) {
            throw new FileException('Une erreur est survenue lors de l\'upload du fichier');
        }

        return $fileName;
    }

    public function uploadCertificate(UploadedFile $file, User $user, \DateTimeInterface $startDate, \DateTimeInterface $endDate): string
    {
        $userName = $this->slugger->slug(sprintf('%s-%s', $user->getLastName(), $user->getFirstName()))->lower();
        $startDateStr = $startDate->format('Ymd');
        $endDateStr = $endDate->format('Ymd');
        
        $fileName = sprintf(
            'certificat-%s-%s-%s.%s',
            $userName,
            $startDateStr,
            $endDateStr,
            $file->guessExtension()
        );

        try {
            $file->move($this->getTargetDirectory(), $fileName);
        } catch (FileException $e) {
            throw new FileException('Une erreur est survenue lors de l\'upload du certificat');
        }

        return $fileName;
    }

    public function getTargetDirectory(): string
    {
        return $this->targetDirectory;
    }

    public function removeFile(string $filename): void
    {
        $filePath = $this->getTargetDirectory() . '/' . $filename;
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
} 