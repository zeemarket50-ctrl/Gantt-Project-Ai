import React, { useState } from 'react';
import type { GeneratedGanttData, GeneratedTask } from '../types';
import { downloadFile } from '../utils/fileDownloader';
import { useLanguage } from '../hooks/useLanguage';

interface GeneratedProjectViewProps {
    projectData: GeneratedGanttData;
    xmlData: string;
    onReset: () => void;
    onGeneratePlan: () => void;
    isGeneratingPlan: boolean;
    projectPlan: string | null;
    planError: string | null;
}

export const GeneratedProjectView: React.FC<GeneratedProjectViewProps> = ({ 
    projectData, 
    xmlData, 
    onReset,
    onGeneratePlan,
    isGeneratingPlan,
    projectPlan,
    planError 
}) => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    
    const handleDownload = () => {
        downloadFile(xmlData, 'project.gan', 'application/xml');
    };

    const handleCopyPlan = () => {
        if (projectPlan) {
            navigator.clipboard.writeText(projectPlan).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleDownloadPlan = () => {
        if (projectPlan) {
            downloadFile(projectPlan, 'project_plan.txt', 'text/plain');
        }
    };

    // Build task tree for rendering
    const tasksById = new Map(projectData.tasks.map(task => [task.id, task]));
    const childrenByParentId = new Map<number, GeneratedTask[]>();
    const rootTasks: GeneratedTask[] = [];

    for (const task of projectData.tasks) {
        if (task.is_milestone) continue; // Don't show milestones in the main task list table

        if (task.parent_id && tasksById.has(task.parent_id)) {
            const children = childrenByParentId.get(task.parent_id) || [];
            children.push(task);
            childrenByParentId.set(task.parent_id, children);
        } else {
            rootTasks.push(task);
        }
    }
    
    // Sort root tasks and children by ID for consistent order
    rootTasks.sort((a,b) => a.id - b.id);
    childrenByParentId.forEach(children => children.sort((a,b) => a.id - b.id));

    const renderTaskRows = (tasks: GeneratedTask[], level: number): React.ReactNode[] => {
        return tasks.flatMap(task => {
            const childTasks = childrenByParentId.get(task.id) || [];
            const resourceName = projectData.resources.find(r => r.id === task.assigned_resource_id)?.name || t('unassigned');
            const paddingLeft = level * 24; // 24px indent per level

            const taskRow = (
                <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span style={{ paddingLeft: `${paddingLeft}px` }}>{task.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{task.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{resourceName}</td>
                </tr>
            );
            
            return [taskRow, ...renderTaskRows(childTasks, level + 1)];
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('projectPlanGenerated')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('downloadMessage')}</p>
                </div>
                 <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    <button onClick={handleDownload} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ltr:mr-2 rtl:ml-2" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        {t('downloadGanFile')}
                    </button>
                    <button onClick={onReset} className="inline-flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                         {t('createNewProject')}
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('projectSummary')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                     <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">{t('resources')}</h4>
                        <ul className="mt-2 text-sm list-disc list-inside text-gray-600 dark:text-gray-400">
                            {projectData.resources.map(r => <li key={r.id}>{r.name} ({r.role})</li>)}
                        </ul>
                     </div>
                     <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">{t('milestones')}</h4>
                        <ul className="mt-2 text-sm list-disc list-inside text-gray-600 dark:text-gray-400">
                           {projectData.tasks.filter(t => t.is_milestone).map(m => <li key={m.id}>{m.name}</li>)}
                        </ul>
                     </div>
                </div>

                <div className="mt-6">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('generatedTasks', { count: projectData.tasks.filter(t => !t.is_milestone).length })}</h4>
                    <div className="overflow-x-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('taskName')}</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('durationDays')}</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('assignedTo')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {renderTaskRows(rootTasks, 0)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* Project Plan Document Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('projectPlanDocument')}</h3>
                    {!projectPlan && (
                        <button 
                            onClick={onGeneratePlan} 
                            disabled={isGeneratingPlan}
                            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {isGeneratingPlan ? t('generatingProjectPlan') : t('generateProjectPlan')}
                        </button>
                    )}
                 </div>

                {isGeneratingPlan && <div className="mt-4 text-center text-gray-500">{t('generatingProjectPlan')}</div>}
                {planError && <p className="mt-4 text-sm text-red-600">{planError}</p>}
                
                {projectPlan && (
                    <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex justify-end gap-2 mb-2">
                            <button onClick={handleCopyPlan} className="text-sm py-1 px-3 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                                {copied ? t('copied') : t('copyToClipboard')}
                            </button>
                            <button onClick={handleDownloadPlan} className="text-sm py-1 px-3 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                                {t('downloadTxtFile')}
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300 max-h-[50vh] overflow-y-auto p-2">
                            {projectPlan}
                        </pre>
                    </div>
                )}
            </div>

        </div>
    );
};