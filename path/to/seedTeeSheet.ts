import { TeeSlot } from '../types/index'

export function generateTeeSlots(): TeeSlot[] {
  const slots: TeeSlot[] = []
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0)

  for (let hour = 7; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const time = new Date(hour, minute)
      if (time >= now && time <= endOfDay) {
        slots.push({
          id: `slot-${now.toISOString().split('T')[0]}-${time.toTimeString().slice(0, 5)}`,
          date: now.toISOString().split('T')[0],
          time: time.toTimeString().slice(0, 5),
          holes: 18,
          maxPlayers: 4,
          status: 'Available',
        })
      }
    }
  }

  return slots
}

export const TEE_SLOTS = generateTeeSlots()
