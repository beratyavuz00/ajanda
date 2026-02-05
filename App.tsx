import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Task, Priority, ViewMode } from './types';
import { parseSmartTask } from './services/geminiService';
import { Button } from './components/Button';
import { TaskCard } from './components/TaskCard';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Search,
  X,
  Clock,
  Calendar,
  BarChart3,
  Moon,
  Sun,
  Bell
} from 'lucide-react';

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getStatusForDate = (dateStr: string) => {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) return 'past';
  if (dateStr === today) return 'today';
  return 'future';
};

// --- Components ---

// Manual Entry Modal
interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

const ManualEntryModal: React.FC<ManualModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      date,
      time: time || undefined,
      priority,
      completed: false
    });
    
    // Reset and close
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('');
    setPriority(Priority.MEDIUM);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-indigo-600 dark:text-indigo-400" />
            Yeni Görev Ekle
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Başlık *</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Dişçi Randevusu"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Tarih</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Saat (İsteğe bağlı)</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Öncelik</label>
             <div className="flex gap-2">
               {Object.values(Priority).map((p) => (
                 <button
                   key={p}
                   type="button"
                   onClick={() => setPriority(p)}
                   className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                     priority === p 
                       ? p === Priority.HIGH ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400' : p === Priority.MEDIUM ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-400' : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                       : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                   {p}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Açıklama</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaylar..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>İptal</Button>
            <Button type="submit" className="flex-1">Kaydet</Button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- App Component ---
const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ajanda-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ajanda-theme') === 'dark';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [smartInput, setSmartInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  
  // Drag and Drop State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // --- Effects ---
  
  // Persist tasks
  useEffect(() => {
    localStorage.setItem('ajanda-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Handle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ajanda-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ajanda-theme', 'light');
    }
  }, [darkMode]);

  // Notifications Check Loop (Every minute)
  useEffect(() => {
    // Request permission initially
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.completed && task.time && !task.notified) {
          const taskDate = new Date(`${task.date}T${task.time}`);
          const diffMs = taskDate.getTime() - now.getTime();
          const diffMins = diffMs / 60000;

          // Notify if within 0 to 10 minutes
          if (diffMins > 0 && diffMins <= 10) {
            new Notification('Yaklaşan Görev: ' + task.title, {
              body: `${task.time} - ${task.description || ''}`,
              icon: '/favicon.ico' // Assuming favicon exists or ignore
            });
            
            // Mark as notified so we don't spam
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notified: true } : t));
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);

  // --- Handlers ---
  const addTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [...prev, { ...newTask, id: generateId(), createdAt: Date.now(), notified: false }]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;

    setIsProcessing(true);
    try {
      const result = await parseSmartTask(smartInput);
      if (result) {
        addTask({
          title: result.title,
          description: result.description,
          date: result.date || new Date().toISOString().split('T')[0],
          time: result.time,
          priority: result.priority === 'HIGH' ? Priority.HIGH : result.priority === 'LOW' ? Priority.LOW : Priority.MEDIUM,
          completed: false
        });
        setSmartInput('');
      } else {
        alert('Anlaşılamadı, lütfen manuel eklemeyi deneyin.');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Drag and Drop Handlers ---
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    setDragOverSection(sectionId);
  };

  const onDrop = (e: React.DragEvent, targetSection: 'past' | 'today' | 'future' | 'completed') => {
    e.preventDefault();
    setDragOverSection(null);
    if (!draggingTaskId) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setTasks(prev => prev.map(t => {
      if (t.id !== draggingTaskId) return t;

      // Logic for changing dates based on drop target
      let newDate = t.date;
      if (targetSection === 'today') newDate = todayStr;
      else if (targetSection === 'future' && t.date <= todayStr) newDate = tomorrowStr;
      
      // If dropped in 'past' we usually don't change date unless we want to force it to yesterday, 
      // but 'past' is usually just a visual container for overdue. 
      // Let's assume dropping in 'past' does nothing for date, just reordering if we had it.
      // But for this simple implementation, let's keep it clean.

      return { ...t, date: newDate };
    }));
    
    setDraggingTaskId(null);
  };

  // --- Filtering Logic ---
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
        const dateA = a.date + (a.time || '00:00');
        const dateB = b.date + (b.time || '00:00');
        return dateA.localeCompare(dateB);
    });
  }, [tasks, searchQuery]);

  const todayStr = new Date().toISOString().split('T')[0];

  const sections = {
    past: filteredTasks.filter(t => t.date < todayStr && !t.completed),
    today: filteredTasks.filter(t => t.date === todayStr),
    future: filteredTasks.filter(t => t.date > todayStr),
    completed: filteredTasks.filter(t => t.completed && t.date < todayStr)
  };

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Today Section */}
      <section 
        onDragOver={(e) => onDragOver(e, 'today')}
        onDrop={(e) => onDrop(e, 'today')}
        className={`rounded-xl transition-all ${dragOverSection === 'today' ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400 border-transparent' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
            Bugün
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        
        <div className="grid gap-3 min-h-[100px]">
          {sections.today.length > 0 ? (
            sections.today.map(task => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} draggable onDragStart={onDragStart} />
            ))
          ) : (
             !dragOverSection && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                <p className="text-slate-500 dark:text-slate-400">Bugün için planlanmış görev yok.</p>
                <Button variant="ghost" className="mt-2 text-indigo-600 dark:text-indigo-400" onClick={() => setIsManualModalOpen(true)}>
                  + Manuel Ekle
                </Button>
              </div>
             )
          )}
          {dragOverSection === 'today' && (
             <div className="h-20 border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center text-indigo-400 font-medium bg-indigo-50/50">
                Buraya Bırak
             </div>
          )}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Overdue / Past Section */}
        <section
           onDragOver={(e) => onDragOver(e, 'past')}
           // onDrop={(e) => onDrop(e, 'past')} // disable dropping in past for logic reasons
           className="relative"
        >
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
             <span className="w-2 h-6 bg-orange-400 rounded-full"></span>
             Gecikmiş
          </h2>
          <div className="grid gap-3 min-h-[50px]">
            {sections.past.length > 0 ? (
              sections.past.map(task => (
                <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} draggable onDragStart={onDragStart} />
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">Gecikmiş görev yok.</p>
            )}
          </div>
        </section>

        {/* Upcoming Section */}
        <section
           onDragOver={(e) => onDragOver(e, 'future')}
           onDrop={(e) => onDrop(e, 'future')}
           className={`rounded-xl transition-all ${dragOverSection === 'future' ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-400 border-transparent' : ''}`}
        >
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
             <span className="w-2 h-6 bg-emerald-400 rounded-full"></span>
             Gelecek
          </h2>
          <div className="grid gap-3 min-h-[100px]">
            {sections.future.slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} draggable onDragStart={onDragStart} />
            ))}
             {dragOverSection === 'future' && (
               <div className="h-16 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center text-emerald-400 font-medium bg-emerald-50/50">
                  Ertele
               </div>
            )}
            {sections.future.length === 0 && !dragOverSection && (
               <p className="text-sm text-slate-400 italic">Yaklaşan görev yok.</p>
            )}
             {sections.future.length > 5 && (
               <Button variant="ghost" onClick={() => setViewMode('list')} className="w-full text-xs">
                 Tümünü Gör ({sections.future.length})
               </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const renderReports = () => {
    // Calculate last 7 days stats
    const stats = [];
    let totalCompleted = 0;
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
        
        // Count completed tasks for this specific date
        // Note: 'date' in task is due date. We might want 'completedAt', but for now assume task.date matches completion context or just use due date.
        // Better: count tasks that were *due* that day and *are* completed.
        const count = tasks.filter(t => t.date === dStr && t.completed).length;
        totalCompleted += count;
        stats.push({ day: dayName, count, date: dStr });
    }

    const maxCount = Math.max(...stats.map(s => s.count), 1); // Avoid div by zero

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Verimlilik Raporu</h2>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Son 7 Gün</p>
                        <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalCompleted} <span className="text-base font-normal text-slate-600 dark:text-slate-400">Görev Tamamlandı</span></h3>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                        <BarChart3 size={24} />
                    </div>
                </div>

                {/* CSS Chart */}
                <div className="flex items-end justify-between gap-2 h-48 pt-4">
                    {stats.map((s) => (
                        <div key={s.date} className="flex flex-col items-center gap-2 flex-1 group">
                            <div className="relative w-full flex justify-center">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                                    {s.count} Görev
                                </div>
                                {/* Bar */}
                                <div 
                                    className="w-full max-w-[40px] bg-indigo-200 dark:bg-indigo-900 rounded-t-lg transition-all duration-500 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 relative overflow-hidden"
                                    style={{ height: `${(s.count / maxCount) * 150}px`, minHeight: '4px' }}
                                >
                                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 h-0 transition-all duration-1000" style={{ height: '0%' }}></div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Günlük Ortalama</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{(totalCompleted / 7).toFixed(1)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tamamlanma Oranı (Genel)</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                    </p>
                </div>
            </div>
        </div>
    );
  };

  const renderCalendar = () => {
    // Simple Calendar Logic
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const monthName = selectedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const changeMonth = (delta: number) => {
      setSelectedDate(new Date(year, month + delta, 1));
    };

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></Button>
            <Button variant="secondary" size="sm" onClick={() => changeMonth(1)}><ChevronRight size={16} /></Button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2 text-center">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
            <div key={d} className="text-xs font-semibold text-slate-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg" />;
            
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div key={dateStr} className={`h-24 border rounded-lg p-2 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors relative ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                <span className={`text-sm font-medium block mb-1 ${isToday ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {date.getDate()}
                </span>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(t => (
                    <div key={t.id} className={`text-[10px] truncate px-1 rounded ${t.completed ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 line-through' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'}`}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-slate-400 text-center">+{dayTasks.length - 3} daha</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tüm Görevler</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Görev ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredTasks.map(task => (
           <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Kayıtlı görev bulunamadı.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      <ManualEntryModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        onSave={addTask} 
      />

      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col hidden md:flex transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
            <LayoutDashboard />
            <span>Ajandam</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'calendar', label: 'Takvim', icon: CalendarIcon },
            { id: 'list', label: 'Liste Görünümü', icon: List },
            { id: 'reports', label: 'Raporlar', icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id as ViewMode)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-xs font-medium opacity-80 mb-1">Bugün</p>
            <div className="text-2xl font-bold mb-2">
              {tasks.filter(t => t.date === todayStr && t.completed).length} / {tasks.filter(t => t.date === todayStr).length}
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div 
                className="bg-white rounded-full h-1.5 transition-all duration-500" 
                style={{ width: `${tasks.filter(t => t.date === todayStr).length > 0 ? (tasks.filter(t => t.date === todayStr && t.completed).length / tasks.filter(t => t.date === todayStr).length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <button 
             onClick={() => setDarkMode(!darkMode)}
             className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
          >
             {darkMode ? <Sun size={16} /> : <Moon size={16} />}
             {darkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 transition-colors duration-300">
          <div className="max-w-4xl mx-auto w-full flex gap-2">
            <div className="flex-1 relative group">
              <form onSubmit={handleSmartSubmit} className="relative h-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Sparkles className={`transition-colors ${isProcessing ? 'text-indigo-500 animate-pulse' : 'text-slate-400 group-focus-within:text-indigo-500'}`} size={18} />
                </div>
                <input
                  id="smart-input"
                  type="text"
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  disabled={isProcessing}
                  placeholder={isProcessing ? "İşleniyor..." : "Gemini ile ekle: 'Yarın 14:00 toplantı'"}
                  className="w-full h-12 pl-10 pr-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                />
                <div className="absolute right-1 top-1 bottom-1">
                  <Button type="submit" size="sm" disabled={!smartInput.trim() || isProcessing} isLoading={isProcessing} className="h-full">
                      Ekle
                  </Button>
                </div>
              </form>
            </div>
            <button 
              onClick={() => setIsManualModalOpen(true)}
              className="w-12 h-12 flex items-center justify-center bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all"
              aria-label="Manuel Ekle"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <div className="max-w-4xl mx-auto pb-20 md:pb-0">
             {/* Mobile Header Title */}
             <div className="md:hidden mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Ajandam</h1>
                <div className="flex gap-2">
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
             </div>

            {viewMode === 'dashboard' && renderDashboard()}
            {viewMode === 'calendar' && renderCalendar()}
            {viewMode === 'list' && renderList()}
            {viewMode === 'reports' && renderReports()}
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-20 pb-safe shadow-lg transition-colors duration-300">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Bugün' },
          { id: 'calendar', icon: CalendarIcon, label: 'Takvim' },
          { id: 'list', icon: List, label: 'Liste' },
          { id: 'reports', icon: BarChart3, label: 'Rapor' },
        ].map((item) => (
           <button
              key={item.id}
              onClick={() => setViewMode(item.id as ViewMode)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${
                viewMode === item.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={22} className={viewMode === item.id ? 'fill-current opacity-20' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
        ))}
      </div>
    </div>
  );
};

export default App;