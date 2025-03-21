import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// Variants cho animation
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            when: 'beforeChildren',
            staggerChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const bounceVariants = {
    animate: {
        y: [0, -20, 0],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

const NotFoundPage: React.FC = () => {
    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center px-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="text-center text-white">
                {/* Số 404 với hiệu ứng bounce */}
                <motion.h1
                    className="text-9xl md:text-[12rem] font-extrabold tracking-tight"
                    variants={bounceVariants}
                    animate="animate"
                >
                    404
                </motion.h1>

                {/* Tiêu đề */}
                <motion.h2
                    className="mt-4 text-3xl md:text-5xl font-bold"
                    variants={itemVariants}
                >
                    Oops! Trang không tìm thấy
                </motion.h2>

                {/* Mô tả */}
                <motion.p
                    className="mt-4 text-lg md:text-xl text-gray-300 max-w-md mx-auto"
                    variants={itemVariants}
                >
                    Có vẻ như bạn đã lạc đường. Đừng lo, chúng tôi sẽ đưa bạn trở lại đúng hướng!
                </motion.p>

                {/* Nút quay lại */}
                <motion.div variants={itemVariants} className="mt-8">
                    <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Quay về trang chủ
                    </Link>
                </motion.div>

                {/* Hiệu ứng trang trí */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    transition={{ duration: 1 }}
                >
                    <div className="w-64 h-64 bg-red-500 rounded-full absolute top-10 left-10 blur-3xl opacity-20 animate-pulse"></div>
                    <div className="w-96 h-96 bg-yellow-300 rounded-full absolute bottom-20 right-20 blur-3xl opacity-20 animate-pulse delay-200"></div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default NotFoundPage;