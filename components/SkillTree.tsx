'use client';

import { useState } from 'react';
import Image from 'next/image';

const SKILL_LEVELS: SkillLevel[] = [
    { level: 1, name: 'Beginner',     xpRequired: 1,  icon: '🌱' },
    { level: 2, name: 'Explorer',     xpRequired: 3,  icon: '🔍' },
    { level: 3, name: 'Practitioner', xpRequired: 6,  icon: '⚡' },
    { level: 4, name: 'Expert',       xpRequired: 10, icon: '🏆' },
    { level: 5, name: 'Master',       xpRequired: 15, icon: '👑' },
];

const SUBJECT_CONFIG: Record<string, SubjectConfig> = {
    maths:     { label: 'Mathematics', color: '#FFDA6E', darkColor: '#4a3f1a', icon: '/icons/maths.svg' },
    language:  { label: 'Language',    color: '#BDE7FF', darkColor: '#1a3a4a', icon: '/icons/language.svg' },
    science:   { label: 'Science',     color: '#E5D0FF', darkColor: '#3a1a4a', icon: '/icons/science.svg' },
    history:   { label: 'History',     color: '#FFECC8', darkColor: '#4a3a1a', icon: '/icons/history.svg' },
    coding:    { label: 'Coding',      color: '#FFC8E4', darkColor: '#4a1a2e', icon: '/icons/coding.svg' },
    economics: { label: 'Economics',   color: '#C8FFDF', darkColor: '#1a4a2a', icon: '/icons/economics.svg' },
};

function getLevel(sessionCount: number): { level: number; name: string; progress: number; nextThreshold: number } {
    let currentLevel = 0;
    let currentName = 'Novice';
    let nextThreshold = SKILL_LEVELS[0].xpRequired;

    for (const skill of SKILL_LEVELS) {
        if (sessionCount >= skill.xpRequired) {
            currentLevel = skill.level;
            currentName = skill.name;
            const nextIndex = SKILL_LEVELS.findIndex(s => s.level === skill.level + 1);
            nextThreshold = nextIndex >= 0 ? SKILL_LEVELS[nextIndex].xpRequired : skill.xpRequired;
        }
    }

    const prevThreshold = currentLevel > 0
        ? SKILL_LEVELS[currentLevel - 1].xpRequired
        : 0;
    const progress = nextThreshold > prevThreshold
        ? Math.min(((sessionCount - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100)
        : 100;

    return { level: currentLevel, name: currentName, progress, nextThreshold };
}

function getOverallLevel(totalSessions: number): number {
    return Math.floor(totalSessions / 3) + 1;
}

const SkillTree = ({ subjectCounts, totalSessions, userName, userImage }: SkillTreeProps) => {
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const overallLevel = getOverallLevel(totalSessions);
    const totalXP = totalSessions * 100;
    const subjects = Object.keys(SUBJECT_CONFIG);

    return (
        <div className="skill-tree-wrapper">
            {/* ── Overall Progress Hub ── */}
            <section className="skill-hub">
                <div className="skill-hub-glow" />
                <div className="skill-hub-content">
                    <div className="skill-hub-avatar">
                        <Image
                            src={userImage}
                            alt={userName}
                            width={80}
                            height={80}
                            className="rounded-full border-2 border-primary/60"
                        />
                        <div className="skill-hub-level-badge">
                            Lv.{overallLevel}
                        </div>
                    </div>
                    <div className="skill-hub-info">
                        <h2 className="text-2xl font-extrabold text-white">{userName}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-primary font-bold text-lg">{totalXP} XP</span>
                            <span className="text-white/40">•</span>
                            <span className="text-white/60 text-sm">{totalSessions} sessions completed</span>
                        </div>
                        <div className="skill-hub-bar-track mt-3">
                            <div
                                className="skill-hub-bar-fill"
                                style={{ width: `${Math.min(((totalSessions % 3) / 3) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                            {3 - (totalSessions % 3)} sessions to next level
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Subject Skill Cards Grid ── */}
            <section className="skill-grid">
                {subjects.map((subject, index) => {
                    const config = SUBJECT_CONFIG[subject];
                    const count = subjectCounts[subject] || 0;
                    const levelInfo = getLevel(count);
                    const isExpanded = expandedSubject === subject;

                    return (
                        <div
                            key={subject}
                            className={`skill-card ${isExpanded ? 'skill-card--expanded' : ''}`}
                            style={{
                                '--skill-color': config.color,
                                '--skill-dark': config.darkColor,
                                animationDelay: `${index * 0.1}s`
                            } as React.CSSProperties}
                            onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                        >
                            {/* Card glow effect */}
                            <div
                                className="skill-card-glow"
                                style={{ background: `radial-gradient(circle at 50% 0%, ${config.color}15, transparent 70%)` }}
                            />

                            {/* Header */}
                            <div className="skill-card-header">
                                <div
                                    className="skill-card-icon"
                                    style={{ backgroundColor: `${config.color}20`, borderColor: `${config.color}40` }}
                                >
                                    <Image src={config.icon} alt={subject} width={28} height={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-base truncate">{config.label}</h3>
                                    <p className="text-xs mt-0.5" style={{ color: config.color }}>
                                        {levelInfo.level > 0 ? `${SKILL_LEVELS[levelInfo.level - 1].icon} ${levelInfo.name}` : '🔒 Novice'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-extrabold text-white">{count}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Sessions</p>
                                </div>
                            </div>

                            {/* Skill Node Path */}
                            <div className="skill-path">
                                {SKILL_LEVELS.map((skill, i) => {
                                    const unlocked = count >= skill.xpRequired;
                                    const isCurrent = levelInfo.level === skill.level;
                                    const isNext = levelInfo.level === skill.level - 1;

                                    return (
                                        <div key={skill.level} className="skill-path-segment">
                                            {i > 0 && (
                                                <div className="skill-connector-wrapper">
                                                    <div
                                                        className={`skill-connector ${unlocked ? 'skill-connector--active' : ''}`}
                                                        style={unlocked ? { backgroundColor: config.color } : undefined}
                                                    />
                                                </div>
                                            )}
                                            <div
                                                className={`skill-node ${unlocked ? 'skill-node--unlocked' : ''} ${isCurrent ? 'skill-node--current' : ''} ${isNext ? 'skill-node--next' : ''}`}
                                                style={unlocked ? {
                                                    borderColor: config.color,
                                                    boxShadow: isCurrent
                                                        ? `0 0 16px ${config.color}60, 0 0 32px ${config.color}20`
                                                        : `0 0 8px ${config.color}30`
                                                } : undefined}
                                                title={`${skill.name} — ${skill.xpRequired} sessions required`}
                                            >
                                                <span className={`text-sm ${unlocked ? '' : 'grayscale opacity-50'}`}>
                                                    {skill.icon}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Progress bar */}
                            <div className="skill-progress-wrapper">
                                <div className="skill-progress-track">
                                    <div
                                        className="skill-progress-fill"
                                        style={{
                                            width: `${levelInfo.progress}%`,
                                            background: `linear-gradient(90deg, ${config.color}80, ${config.color})`
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-white/30 mt-1">
                                    {levelInfo.level < 5
                                        ? `${count}/${levelInfo.nextThreshold} to next rank`
                                        : '✨ MAX RANK'}
                                </p>
                            </div>

                            {/* Expanded milestone details */}
                            {isExpanded && (
                                <div className="skill-details">
                                    <div className="skill-details-divider" style={{ borderColor: `${config.color}20` }} />
                                    <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Skill Milestones</p>
                                    {SKILL_LEVELS.map(skill => {
                                        const unlocked = count >= skill.xpRequired;
                                        return (
                                            <div key={skill.level} className="skill-milestone">
                                                <span className={`text-sm ${unlocked ? '' : 'opacity-30 grayscale'}`}>{skill.icon}</span>
                                                <span className={`text-sm flex-1 ${unlocked ? 'text-white' : 'text-white/30'}`}>
                                                    {skill.name}
                                                </span>
                                                <span className={`text-xs ${unlocked ? 'text-green-400' : 'text-white/20'}`}>
                                                    {unlocked ? '✓ Unlocked' : `${skill.xpRequired} sessions`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </section>
        </div>
    );
};

export default SkillTree;
