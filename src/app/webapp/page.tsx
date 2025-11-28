// src/app/webapp/page.tsx  ← فقط این فایل رو کامل جایگزین کن
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Task = { id: number; title: string; status: string; priority: string; created_at: string }

// تعریف تایپ تلگرام تا TypeScript سکته نکند
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        initData?: string
        initDataUnsafe?: any
      }
    }
  }
}

export default function TelegramWebAppPro() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
      window.Telegram.WebApp.setHeaderColor('#1e1b4b')
      window.Telegram.WebApp.setBackgroundColor('#0f0a1e')
    }

    fetchTasks()

    const channel = supabase
      .channel('tasks-webapp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    setTasks((data as Task[]) || [])
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask,
          telegramId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? Math.floor(Math.random() * 1000000),
        }),
      })
      if (response.ok) {
        setNewTask('')
        fetchTasks()
      } else {
        const error = await response.json()
        console.error('Error adding task:', error)
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const moveTask = async (id: number, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', id)
  }

  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const progress = total ? Math.round((done / total) * 100) : 0

  const chartData = [
    { name: 'در انتظار', value: tasks.filter(t => t.status === 'todo').length, fill: '#8b5cf6' },
    { name: 'در حال انجام', value: tasks.filter(t => t.status === 'inprogress').length, fill: '#3b82f6' },
    { name: 'انجام شده', value: done, fill: '#10b981' },
  ]

  const columns = {
    todo: { title: 'در انتظار', color: 'from-purple-500 to-pink-500' },
    inprogress: { title: 'در حال انجام', color: 'from-blue-500 to-cyan-500' },
    done: { title: 'انجام شده', color: 'from-emerald-500 to-teal-500' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-x-hidden">
      {/* پس‌زمینه انیمیشنی */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-pink-600/50 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent animate-ping" />
      </div>

      <div className="relative z-10 p-4 pb-20">
        {/* هدر با آمار */}
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            TaskBot Pro
          </h1>
          <p className="text-purple-200 mt-2">مدیریت حرفه‌ای وظایف شما</p>

          <div className="mt-6 backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg">پیشرفت امروز</span>
              <span className="text-3xl font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-4 bg-white/20" />
          </div>
        </motion.div>

        {/* نمودار زنده */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 mb-6 border border-white/20"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #8b5cf6' }} />
              <Bar dataKey="value" radius={[20, 20, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* اضافه کردن وظیفه */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 mb-8 border border-white/20 flex gap-3"
        >
          <Input
            placeholder="وظیفه جدید بنویسید..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="bg-white/20 border-white/30 text-white placeholder-purple-300"
          />
          <Button onClick={addTask} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
            اضافه کن
          </Button>
        </motion.div>

        {/* کانبان با انیمیشن */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([key, { title, color }]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`backdrop-blur-xl bg-gradient-to-br ${color} bg-opacity-20 rounded-2xl p-6 border border-white/30 min-h-96`}
            >
              <h2 className="text-2xl font-bold text-center mb-6 text-white drop-shadow-lg">{title}</h2>
              <div className="space-y-4">
                <AnimatePresence>
                  {tasks
                    .filter(t => t.status === key)
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        draggable
                        onDragEnd={() => moveTask(task.id, key)}
                      >
                        <Card className="bg-white/20 backdrop-blur border-white/30 shadow-2xl">
                          <div className="p-4">
                            <p className="font-semibold text-white">{task.title}</p>
                            <Badge className="mt-3" variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                              {task.priority}
                            </Badge>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}