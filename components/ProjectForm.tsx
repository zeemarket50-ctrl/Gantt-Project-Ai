import React, { useState, useMemo } from 'react';
import type { ProjectData, TeamMember, Milestone } from '../types';
import { useLanguage } from '../hooks/useLanguage';

// Fix: Define props interface for ProjectForm
interface ProjectFormProps {
    onSubmit: (data: ProjectData) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit }) => {
    const { t } = useLanguage();

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const predefinedRoles = [
        t('roleProjectManager'),
        t('roleCoordinator'),
        t('roleBudgetSupervisor'),
        t('roleEventOrganizer'),
        t('roleSiteSupervisor'),
        t('roleEventAssistant'),
    ];

    const predefinedMilestones = [
        t('milestoneInitiation'),
        t('milestonePlanning'),
        t('milestoneExecution'),
        t('milestoneMonitoring'),
        t('milestoneClosing'),
        t('milestoneKickoff'),
        t('milestoneDesignComplete'),
        t('milestoneDevelopmentComplete'),
        t('milestoneTestingComplete'),
        t('milestoneLaunch'),
    ];

    const [formData, setFormData] = useState<ProjectData>(() => ({
        projectName: 'مشروع ذكاء اصطناعي جديد',
        projectType: 'software',
        description: 'تطوير تطبيق جديد مدعوم بالذكاء الاصطناعي لأتمتة المهام.',
        startDate: today,
        endDate: nextMonthStr,
        teamMembers: [{ id: 'tm-1', name: 'أحمد', role: predefinedRoles[0] }],
        milestones: [{ id: 'ms-1', name: predefinedMilestones[0], startDate: today, duration: 7 }],
        weekendDays: [5, 6], // Default to Friday, Saturday
        taskGranularity: 'medium',
    }));


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addTeamMember = () => {
        setFormData(prev => ({
            ...prev,
            teamMembers: [...prev.teamMembers, { id: `tm-${Date.now()}`, name: '', role: predefinedRoles[0] }]
        }));
    };

    const removeTeamMember = (id: string) => {
        setFormData(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.filter(tm => tm.id !== id)
        }));
    };

    const handleTeamMemberChange = (id: string, field: 'name' | 'role', value: string) => {
        setFormData(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.map(tm => tm.id === id ? { ...tm, [field]: value } : tm)
        }));
    };
    
    const addMilestone = () => {
        setFormData(prev => ({
            ...prev,
            milestones: [...prev.milestones, { id: `ms-${Date.now()}`, name: predefinedMilestones[0], startDate: today, duration: 1 }]
        }));
    };

    const removeMilestone = (id: string) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.filter(ms => ms.id !== id)
        }));
    };

    const handleMilestoneChange = (id: string, field: 'name' | 'startDate' | 'duration', value: string) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.map(ms => {
                if (ms.id === id) {
                    const updatedValue = field === 'duration' ? (parseInt(value, 10) || 1) : value;
                    return { ...ms, [field]: updatedValue };
                }
                return ms;
            })
        }));
    };

    const handleWeekendChange = (dayIndex: number) => {
        setFormData(prev => {
            const weekendDays = prev.weekendDays.includes(dayIndex)
                ? prev.weekendDays.filter(d => d !== dayIndex)
                : [...prev.weekendDays, dayIndex];
            return { ...prev, weekendDays };
        });
    };
    
    const calculateEndDate = useMemo(() => (startDateStr: string, duration: number, weekendDays: number[]): string => {
        if (!startDateStr || !duration || duration < 1) {
            return '...';
        }
    
        try {
            // Use UTC dates to prevent timezone-related issues.
            // This ensures the calculation is consistent regardless of the user's local time.
            const parts = startDateStr.split('-').map(p => parseInt(p, 10));
            const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    
            let workingDaysAdded = 0;
            
            while (workingDaysAdded < duration) {
                // getUTCDay() is used to match the UTC date object.
                if (!weekendDays.includes(d.getUTCDay())) {
                    workingDaysAdded++;
                }
                
                // Only advance the date if we haven't found the last working day yet.
                if (workingDaysAdded < duration) {
                    d.setUTCDate(d.getUTCDate() + 1);
                }
            }
            
            // Format YYYY-MM-DD from the final UTC date.
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return t('invalidDate');
        }
    }, [t]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic Validation
        if (!formData.projectName || !formData.description || !formData.startDate || !formData.endDate) {
            alert(t('validationRequiredFields'));
            return;
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            alert(t('validationEndDate'));
            return;
        }
        onSubmit(formData);
    };
    
    const renderInput = (id: string, label: string, name: keyof ProjectData, type: string = 'text', required: boolean = true, props: object = {}) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input
                type={type}
                id={id}
                name={name}
                value={formData[name] as string}
                onChange={handleChange}
                required={required}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...props}
            />
        </div>
    );
    
    const daysOfWeek = [
        { label: t('daySunday'), value: 0 },
        { label: t('dayMonday'), value: 1 },
        { label: t('dayTuesday'), value: 2 },
        { label: t('dayWednesday'), value: 3 },
        { label: t('dayThursday'), value: 4 },
        { label: t('dayFriday'), value: 5 },
        { label: t('daySaturday'), value: 6 },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{t('describeYourProject')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {renderInput('projectName', t('projectName'), 'projectName')}
                    <div>
                        <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('projectType')}</label>
                        <select id="projectType" name="projectType" value={formData.projectType} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            <option value="software">{t('projectTypeSoftware')}</option>
                            <option value="campaign">{t('projectTypeCampaign')}</option>
                            <option value="ecommerce">{t('projectTypeEcommerce')}</option>
                            <option value="construction">{t('projectTypeConstruction')}</option>
                            <option value="event">{t('projectTypeEvent')}</option>
                            <option value="research">{t('projectTypeResearch')}</option>
                            <option value="content">{t('projectTypeContent')}</option>
                            <option value="education">{t('projectTypeEducation')}</option>
                            <option value="custom">{t('projectTypeCustom')}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('projectDescription')}</label>
                    <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={t('projectDescriptionPlaceholder')} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput('startDate', t('startDate'), 'startDate', 'date')}
                    {renderInput('endDate', t('endDate'), 'endDate', 'date')}
                </div>

                {/* Team Members */}
                <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <legend className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('teamMembers')}</legend>
                    <div className="mt-4 space-y-4">
                        {formData.teamMembers.map((member) => {
                             const isPredefinedRole = predefinedRoles.includes(member.role);
                             return (
                                <div key={member.id} className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                                    <input 
                                        type="text" 
                                        placeholder={t('teamMemberNamePlaceholder')} 
                                        value={member.name} 
                                        onChange={e => handleTeamMemberChange(member.id, 'name', e.target.value)} 
                                        className="flex-1 mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                    />
                                    <div className="flex-1 w-full flex gap-2">
                                        <select
                                            value={isPredefinedRole ? member.role : '_custom'}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                handleTeamMemberChange(member.id, 'role', newValue === '_custom' ? '' : newValue);
                                            }}
                                            className={`mt-1 block px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm ${!isPredefinedRole ? 'w-2/5' : 'w-full'}`}
                                        >
                                            {predefinedRoles.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                            <option value="_custom">{t('roleOther')}</option>
                                        </select>
                                        {!isPredefinedRole && (
                                            <input
                                                type="text"
                                                placeholder={t('teamMemberRolePlaceholder')}
                                                value={member.role}
                                                onChange={(e) => handleTeamMemberChange(member.id, 'role', e.target.value)}
                                                className="mt-1 block w-3/5 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                                required
                                            />
                                        )}
                                    </div>
                                    <button type="button" onClick={() => removeTeamMember(member.id)} className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 self-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            );
                        })}
                        <button type="button" onClick={addTeamMember} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">{t('addTeamMember')}</button>
                    </div>
                </fieldset>
                
                 {/* Milestones / Phases */}
                <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <legend className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('keyMilestones')}</legend>
                    <div className="mt-4 space-y-4">
                        {formData.milestones.map((milestone) => {
                            const isPredefinedMilestone = predefinedMilestones.includes(milestone.name);
                            const calculatedEndDate = calculateEndDate(milestone.startDate, milestone.duration, formData.weekendDays);
                            return (
                                <div key={milestone.id} className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                                    {/* Milestone Name */}
                                    <div className="flex-grow w-full md:w-2/5">
                                        <label htmlFor={`ms-name-${milestone.id}`} className="sr-only">{t('milestoneNamePlaceholder')}</label>
                                        <div className="flex gap-2">
                                            <select
                                                id={`ms-name-${milestone.id}`}
                                                value={isPredefinedMilestone ? milestone.name : '_custom'}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    handleMilestoneChange(milestone.id, 'name', newValue === '_custom' ? '' : newValue);
                                                }}
                                                className={`mt-1 block px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm ${!isPredefinedMilestone ? 'w-2/5' : 'w-full'}`}
                                            >
                                                {predefinedMilestones.map((name) => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                                <option value="_custom">{t('milestoneOther')}</option>
                                            </select>
                                            {!isPredefinedMilestone && (
                                                <input
                                                    type="text"
                                                    placeholder={t('milestoneNamePlaceholder')}
                                                    value={milestone.name}
                                                    onChange={(e) => handleMilestoneChange(milestone.id, 'name', e.target.value)}
                                                    className="mt-1 block w-3/5 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {/* Start Date */}
                                    <div className="w-full md:w-auto">
                                        <label htmlFor={`ms-start-${milestone.id}`} className="sr-only">{t('startDate')}</label>
                                        <input 
                                            type="date" 
                                            id={`ms-start-${milestone.id}`}
                                            value={milestone.startDate} 
                                            onChange={e => handleMilestoneChange(milestone.id, 'startDate', e.target.value)} 
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" 
                                            required 
                                        />
                                    </div>
                                    {/* Duration */}
                                    <div className="w-full md:w-auto">
                                        <label htmlFor={`ms-duration-${milestone.id}`} className="sr-only">{t('duration')}</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                id={`ms-duration-${milestone.id}`}
                                                value={milestone.duration} 
                                                onChange={e => handleMilestoneChange(milestone.id, 'duration', e.target.value)} 
                                                className="mt-1 block w-full md:w-28 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                                                min="1"
                                                required 
                                            />
                                            <span className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center pointer-events-none text-gray-500 text-sm">{t('days')}</span>
                                        </div>
                                    </div>
                                    {/* Calculated End Date */}
                                    <div className="w-full md:w-auto">
                                        <label className="sr-only">{t('calculatedEndDate')}</label>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center p-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-md w-full md:w-36">
                                            {calculatedEndDate}
                                        </p>
                                    </div>
                                    {/* Remove Button */}
                                    <button type="button" onClick={() => removeMilestone(milestone.id)} className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 self-center md:self-auto">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            );
                        })}
                        <button type="button" onClick={addMilestone} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">{t('addMilestone')}</button>
                    </div>
                </fieldset>

                {/* Weekends */}
                <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <legend className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('weekends')}</legend>
                     <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                        {daysOfWeek.map(day => (
                            <label key={day.value} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.weekendDays.includes(day.value)}
                                    onChange={() => handleWeekendChange(day.value)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div>
                    <label htmlFor="taskGranularity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('taskGranularity')}</label>
                    <select id="taskGranularity" name="taskGranularity" value={formData.taskGranularity} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option value="low">{t('granularityLow')}</option>
                        <option value="medium">{t('granularityMedium')}</option>
                        <option value="high">{t('granularityHigh')}</option>
                    </select>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button type="submit" className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        {t('generateGanttProject')}
                    </button>
                </div>
            </form>
        </div>
    );
};