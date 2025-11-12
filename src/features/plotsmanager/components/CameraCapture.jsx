/**
 * CameraCapture
 * Component to capture photos using getUserMedia API
 * Works in PWA without causing app reload
 */

import React, { useState, useRef, useEffect } from 'react'
import { Camera, X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'

export default function CameraCapture({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  // Start camera stream
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const startCamera = async () => {
    try {
      // Arrêter le stream précédent si existant
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      setError(null)

      // Essayer avec caméra arrière
      let constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      let mediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        // Fallback : essayer sans facingMode (appareil avec une seule caméra)
        console.error('[CameraCapture] Fallback to default camera:', err)
        constraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        }
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      }

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('[CameraCapture] Error starting camera:', err)
      setStream(null)
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[CameraCapture] Video or canvas ref not available')
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create File from Blob
          const timestamp = new Date().getTime()
          const file = new File([blob], `photo_${timestamp}.jpg`, { type: 'image/jpeg' })

          // Return photo to parent
          onCapture(file)

          // Close camera
          handleClose()
        } else {
          console.error('[CameraCapture] Failed to create blob from canvas')
          setError('Erreur lors de la capture de la photo')
        }
      }, 'image/jpeg', 0.95)
    } catch (err) {
      console.error('[CameraCapture] Error capturing photo:', err)
      setError('Erreur lors de la capture de la photo')
    }
  }

  const handleClose = () => {
    stopCamera()
    setError(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Prendre une photo"
      size="full"
    >
      <div className="flex flex-col h-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Camera preview */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Actions - with safe area padding */}
        <div className="flex justify-end gap-2 sm:gap-3 pb-safe" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <Button
            variant="outline"
            onClick={handleClose}
            className="min-h-[48px] min-w-[48px] px-3 sm:px-6"
          >
            <X className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Annuler</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleCapture}
            disabled={!stream || !!error}
            className="min-h-[48px] min-w-[48px] px-3 sm:px-6"
          >
            <Camera className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Capturer</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
