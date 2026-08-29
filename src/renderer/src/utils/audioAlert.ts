import orderAlertSoundAsset from '../assets/order_alert.mp3'

export const playNewOrderAlert = (): void => {
  try {
    const audio = new Audio(orderAlertSoundAsset)
    audio.currentTime = 0
    void audio.play().catch((err) => {
      console.warn('Audio playback failed or blocked:', err)
    })
  } catch (err) {
    console.warn('Audio play exception:', err)
  }
}
