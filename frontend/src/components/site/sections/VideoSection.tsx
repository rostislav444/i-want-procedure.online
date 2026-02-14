'use client'

import { Play, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface VideoSectionProps {
  videoUrl?: string
  thumbnail?: string
}

export default function VideoSection({
  videoUrl = '',
  thumbnail = '/screens/main.png'
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  // Check if videoUrl is YouTube
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')

  // Extract YouTube ID if needed
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }

  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const keyTakeaways = [
    'Як клієнти записуються через Telegram',
    'Як ви отримуєте сповіщення та підтверджуєте',
    'Як всі записи синхронізуються з Google Calendar',
  ]

  return (
    <section id="video" className="py-24 bg-secondary relative overflow-hidden">
      <div className="absolute w-64 h-64 bg-purple-200 -bottom-20 -right-32 rounded-full blur-3xl opacity-40 animate-blob" />

      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
            <Play className="w-4 h-4" />
            <span>Подивіться, як це працює</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            2 хвилини, щоб зрозуміти <span className="gradient-text">всю систему</span>
          </h2>
        </div>

        {/* Video Player */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-10"
          style={{
            border: '4px solid',
            borderImage: 'linear-gradient(to right, #ec4899, #f43f5e) 1'
          }}
        >
          <div className="aspect-video bg-black">
            {!isPlaying && !videoUrl && (
              // Placeholder with play button
              <div className="relative w-full h-full cursor-pointer group" onClick={handlePlay}>
                <Image
                  src={thumbnail}
                  alt="Video Thumbnail"
                  fill
                  className="object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg p-3">
                  📹 <strong>Відео демо буде доступне незабаром</strong>
                </div>
              </div>
            )}

            {!isPlaying && videoUrl && !isYouTube && (
              // HTML5 video with play button
              <div className="relative w-full h-full cursor-pointer group" onClick={handlePlay}>
                <video
                  className="w-full h-full object-cover"
                  poster={thumbnail}
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
            )}

            {isPlaying && videoUrl && !isYouTube && (
              // HTML5 video playing
              <video
                className="w-full h-full"
                controls
                autoPlay
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            )}

            {youtubeId && (
              // YouTube embed
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isPlaying ? 1 : 0}`}
                title="Demo Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            {keyTakeaways.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
