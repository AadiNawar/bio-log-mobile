import * as faceapi from 'face-api.js';

export class FaceRecognitionService {
  private static instance: FaceRecognitionService;
  private isInitialized = false;

  static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load models
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    this.isInitialized = true;
  }

  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Face recognition service not initialized');
    }

    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection || null;
  }

  async extractFaceDescriptor(imageElement: HTMLImageElement): Promise<number[] | null> {
    const detection = await this.detectFace(imageElement);
    return detection ? Array.from(detection.descriptor) : null;
  }

  compareFaces(descriptor1: number[], descriptor2: number[]): number {
    const dist = faceapi.euclideanDistance(descriptor1, descriptor2);
    return 1 - dist; // Convert distance to similarity score (0-1)
  }

  findBestMatch(targetDescriptor: number[], knownDescriptors: { id: string; descriptor: number[] }[], threshold: number = 0.6): { id: string; confidence: number } | null {
    let bestMatch: { id: string; confidence: number } | null = null;

    for (const known of knownDescriptors) {
      const confidence = this.compareFaces(targetDescriptor, known.descriptor);
      
      if (confidence > threshold && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { id: known.id, confidence };
      }
    }

    return bestMatch;
  }
}

export const faceRecognition = FaceRecognitionService.getInstance();