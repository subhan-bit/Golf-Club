import type { TeeSlot } from '../types/index'

export function generateTeeSlots(): TeeSlot[] {
  const slots: TeeSlot[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(today)
    day.setDate(day.getDate() + dayOffset)
    const dateStr = day.toISOString().split('T')[0]

    for (let hour = 7; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        slots.push({
          id: `slot-${dateStr}-${timeStr}`,
          date: dateStr,
          time: timeStr,
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