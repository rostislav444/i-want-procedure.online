'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export default function Logo({ className, width = 180, height = 60 }: LogoProps) {
  return (
    <>
      <Image
        src="/images/logo-orbit-light-new.png"
        alt="Procedure"
        width={width}
        height={height}
        className={`${className || ''} dark:hidden`}
        priority
      />
      <Image
        src="/images/logo-orbit-dark-new.png"
        alt="Procedure"
        width={width}
        height={height}
        className={`${className || ''} hidden dark:block`}
        priority
      />
    </>
  )
}
