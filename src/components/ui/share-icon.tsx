import Image from 'next/image'

export function ShareIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <Image src="/Icons/Icons-share.svg" alt="" width={size} height={size} className={className} />
}
