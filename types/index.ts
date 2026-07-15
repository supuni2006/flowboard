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

export type CardItem = {
  id: string
  list_id: string
  title: string
  description: string
  position: number
  due_date: string | null
  created_by: string | null
  created_at: string
}
