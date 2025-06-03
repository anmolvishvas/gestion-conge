<?php

namespace App\Controller;

use App\Entity\Leave;
use App\Service\FileUploader;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

#[Route('/api')]
class LeaveController extends AbstractController
{
    private FileUploader $fileUploader;
    private EntityManagerInterface $entityManager;

    public function __construct(
        FileUploader $fileUploader, 
        EntityManagerInterface $entityManager
    ) {
        $this->fileUploader = $fileUploader;
        $this->entityManager = $entityManager;
    }

    #[Route('/leaves/{id}/status', name: 'update_leave_status', methods: ['PUT'])]
    public function updateStatus(Request $request, Leave $leave): Response
    {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['status'])) {
            throw new BadRequestHttpException('Le statut est requis');
        }

        if (!in_array($data['status'], ['En attente', 'Approuvé', 'Rejeté'])) {
            throw new BadRequestHttpException('Statut invalide');
        }

        $leave->setStatus($data['status']);
        $this->entityManager->flush();

        return $this->json($leave, 200, [], ['groups' => ['leave:read']]);
    }

    #[Route('/leaves/{id}/certificate', name: 'get_leave_certificate', methods: ['GET'])]
    public function getCertificate(Leave $leave): Response
    {
        if (!$leave->getCertificate()) {
            throw new NotFoundHttpException('Aucun certificat trouvé pour ce congé');
        }

        $filePath = $this->fileUploader->getTargetDirectory() . '/' . $leave->getCertificate();
        
        if (!file_exists($filePath)) {
            throw new NotFoundHttpException('Le fichier du certificat est introuvable');
        }

        $response = new BinaryFileResponse($filePath);
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $leave->getCertificate()
        );
        
        $mimeType = mime_content_type($filePath);
        $response->headers->set('Content-Type', $mimeType);
        
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return $response;
    }

    #[Route('/leaves/{id}/certificate', name: 'upload_leave_certificate', methods: ['POST'])]
    public function uploadCertificate(Request $request, Leave $leave): Response
    {
        /** @var UploadedFile[] $certificateFiles */
        $certificateFiles = $request->files->get('certificate');

        if (!$certificateFiles || !is_array($certificateFiles) || empty($certificateFiles)) {
            throw new BadRequestHttpException('Aucun fichier n\'a été envoyé');
        }

        $certificateFile = $certificateFiles[0];
        if (!$certificateFile instanceof UploadedFile) {
            throw new BadRequestHttpException('Format de fichier invalide');
        }

        $mimeType = $certificateFile->getMimeType();
        $allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        
        if (!in_array($mimeType, $allowedMimeTypes)) {
            throw new BadRequestHttpException('Type de fichier non autorisé. Seuls les fichiers PDF, JPEG et PNG sont acceptés.');
        }

        if ($leave->getCertificate()) {
            $this->fileUploader->removeFile($leave->getCertificate());
        }

        $fileName = $this->fileUploader->uploadCertificate(
            $certificateFile,
            $leave->getUser(),
            $leave->getStartDate(),
            $leave->getEndDate()
        );
        
        $leave->setCertificate($fileName);

        $this->entityManager->persist($leave);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Certificat uploadé avec succès',
            'certificate' => $fileName
        ]);
    }

    #[Route('/leaves/{id}/certificate', name: 'delete_leave_certificate', methods: ['DELETE'])]
    public function deleteCertificate(Leave $leave): Response
    {
        if (!$leave->getCertificate()) {
            throw new BadRequestHttpException('Aucun certificat à supprimer');
        }

        $this->fileUploader->removeFile($leave->getCertificate());
        
        $leave->setCertificate(null);
        
        $this->entityManager->persist($leave);
        $this->entityManager->flush();

        return $this->json(['message' => 'Certificat supprimé avec succès']);
    }
} 