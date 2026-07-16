export type Board = {
  id: string
  title: string
  color: string
  created_by: string | null
  created_at: string
}

export type List = {
  id: string
  board_id: string
  title: string
  position: number
  created_at: string
}

export type CardStatus = 'upcoming' | 'ongoing' | 'complete' | 'cancelled' | 'deleted'

export type CardItem = {
  id: string
  list_id: string
  title: string
  description: string
  position: number
  due_date: string | null
  status: CardStatus
  color: string | null
  created_by: string | null
  created_at: string
}


export type Attachment = {
  id: string
  card_id: string
  file_name: string
  file_url: string
  file_path: string
  file_size: number | null
  created_at: string
}