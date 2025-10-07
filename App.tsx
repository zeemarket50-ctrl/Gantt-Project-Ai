import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ProjectForm } from './components/ProjectForm';
import { Spinner } from './components/Spinner';
import { Alert } from './components/Alert';
import { GeneratedProjectView } from './components/GeneratedProjectView';
import type { ProjectData, GeneratedGanttData } from './types';
import { generateGanttData, generateProjectPlanDocument } from './services/geminiService';
import { generateGanttXML } from './utils/xmlGenerator';
import { downloadFile } from './utils/fileDownloader';
import { useLanguage } from './hooks/useLanguage';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedGanttData, setGeneratedGanttData] = useState<GeneratedGanttData | null>(null);
    const [generatedXml, setGeneratedXml] = useState<string | null>(null);
    const { language, t } = useLanguage();

    const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
    const [projectPlan, setProjectPlan] = useState<string | null>(null);
    const [planError, setPlanError] = useState<string | null>(null);
    
    // Store project data to use for plan generation later
    const [currentProjectData, setCurrentProjectData] = useState<ProjectData | null>(null);


    const handleFormSubmit = useCallback(async (projectData: ProjectData) => {
        setIsLoading(true);
        setError(null);
        setGeneratedGanttData(null);
        setGeneratedXml(null);
        setProjectPlan(null);
        setPlanError(null);
        setCurrentProjectData(projectData); // Save project data

        try {
            const ganttData = await generateGanttData(projectData, language);
            setGeneratedGanttData(ganttData);

            const xmlContent = generateGanttXML(projectData, ganttData);
            setGeneratedXml(xmlContent);

            downloadFile(
                xmlContent,
                `${projectData.projectName.replace(/\s/g, '_')}.gan`,
                'application/xml'
            );
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : t('unknownError');
            setError(t('generationFailedError', { errorMessage }));
        } finally {
            setIsLoading(false);
        }
    }, [language, t]);
    
    const handleGeneratePlan = useCallback(async () => {
        if (!currentProjectData || !generatedGanttData) return;

        setIsGeneratingPlan(true);
        setPlanError(null);
        try {
            const plan = await generateProjectPlanDocument(currentProjectData, generatedGanttData, language);
            setProjectPlan(plan);
        } catch (e) {
             console.error(e);
            const errorMessage = e instanceof Error ? e.message : t('unknownError');
            setPlanError(t('planGenerationFailedError', { errorMessage }));
        } finally {
            setIsGeneratingPlan(false);
        }

    }, [currentProjectData, generatedGanttData, language, t]);


    const handleReset = useCallback(() => {
        setGeneratedGanttData(null);
        setGeneratedXml(null);
        setError(null);
        setIsLoading(false);
        setCurrentProjectData(null);
        setProjectPlan(null);
        setPlanError(null);
        setIsGeneratingPlan(false);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {!generatedGanttData && !isLoading && (
                         <ProjectForm onSubmit={handleFormSubmit} />
                    )}
                   
                    {isLoading && <Spinner />}

                    {error && <Alert message={error} type="error" />}

                    {generatedGanttData && generatedXml && !isLoading && (
                        <GeneratedProjectView 
                            projectData={generatedGanttData} 
                            xmlData={generatedXml} 
                            onReset={handleReset} 
                            onGeneratePlan={handleGeneratePlan}
                            isGeneratingPlan={isGeneratingPlan}
                            projectPlan={projectPlan}
                            planError={planError}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;