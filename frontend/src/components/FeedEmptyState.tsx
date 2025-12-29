'use client'

import React from 'react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { 
  Search, 
  MapPin, 
  MessageSquare, 
  Calendar, 
  Users, 
  BookOpen, 
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useRecommendedBooks, useBookShelf } from '@book-app/shared'
import RecommendedBookCard from './RecommendedBookCard'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    }
  },
}

export default function FeedEmptyState() {
  const { books, loading: recsLoading } = useRecommendedBooks()
  const { addToShelf } = useBookShelf()

  const features = [
    {
      title: 'Build your library',
      description: 'Search and shelf your favorite books to track your progress.',
      icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
      href: '/search?type=books',
      cta: 'Search books',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Join the conversation',
      description: 'Discuss your favorite reads and authors in our community forums.',
      icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
      href: '/forums',
      cta: 'Explore forums',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Local book events',
      description: 'Find signings, readings, and releases at bookstores near you.',
      icon: <Calendar className="w-5 h-5 text-brand-indigo" />,
      href: '/search?type=events',
      cta: 'Find events',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Nearby bookstores',
      description: 'Discover and support independent bookstores in your area.',
      icon: <MapPin className="w-5 h-5 text-amber-600" />,
      href: '/search?type=bookstores',
      cta: 'View map',
      bgColor: 'bg-amber-50',
    }
  ]

  const handleAddToShelf = async (bookId: number) => {
    try {
      await addToShelf(bookId, 'to_read')
    } catch (error) {
      console.error('Failed to add book to shelf:', error)
    }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="max-w-4xl mx-auto space-y-12 py-6"
    >
      {/* 1. Header Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo/10 text-brand-indigo text-sm font-bold"
        >
          <Sparkles size={16} />
          <span>New account created</span>
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tight">Your feed is waiting.</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Every great story starts with a single page. Build your reading world by 
          tracking your collection, joining discussions, and discovering the community around you.
        </p>
      </motion.div>

      {/* 2. Features Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((item, idx) => (
          <Link key={idx} href={item.href}>
            <motion.div
              whileHover={{ y: -4, borderColor: 'rgba(79, 70, 229, 0.4)' }}
              className="group p-6 rounded-3xl border border-border-default bg-background-card transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 ${item.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center text-brand-indigo font-bold text-sm">
                <span>{item.cta}</span>
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {recsLoading && (
        <motion.div variants={itemVariants} className="space-y-6 pt-6 border-t border-border-default">
          <div className="h-8 w-48 bg-background-muted rounded-lg animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[240px] h-72 bg-background-muted rounded-3xl animate-pulse flex-none" />
            ))}
          </div>
        </motion.div>
      )}
      
      {/* 4. Secondary Action (Find Friends) */}
      <motion.div variants={itemVariants} className="bg-background-muted rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <Users className="text-brand-indigo" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-text-primary">Looking for friends?</h4>
            <p className="text-text-secondary text-sm">Follow other readers to see their reviews in your feed.</p>
          </div>
        </div>
        <Link href="/search?type=people">
          <button className="whitespace-nowrap bg-white text-text-primary font-bold px-6 py-3 rounded-2xl border border-border-default hover:border-brand-indigo transition-colors shadow-sm">
            Find people to follow
          </button>
        </Link>
      </motion.div>

      {/* 5. Library Shortcut */}
      <motion.div variants={itemVariants} className="bg-background-muted rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <BookOpen className="text-emerald-600" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-text-primary">Your Personal Library</h4>
            <p className="text-text-secondary text-sm">View your shelves, track progress, and manage your private collection.</p>
          </div>
        </div>
        <Link href="/library">
          <button className="whitespace-nowrap bg-white text-text-primary font-bold px-6 py-3 rounded-2xl border border-border-default hover:border-brand-indigo transition-colors shadow-sm">
            Go to my library
          </button>
        </Link>
      </motion.div>
    </motion.div>
  )
}
