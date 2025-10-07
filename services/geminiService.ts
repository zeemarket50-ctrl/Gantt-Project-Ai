import { GoogleGenAI, Type } from '@google/genai';
import type { ProjectData, GeneratedGanttData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please add it to your .env file.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        resources: {
            type: Type.ARRAY,
            description: "List of team members or resources involved in the project.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Unique integer ID for the resource, starting from 1." },
                    name: { type: Type.STRING, description: "Name of the resource." },
                    role: { type: Type.STRING, description: "Role of the resource in the project." },
                },
                required: ["id", "name", "role"],
            }
        },
        tasks: {
            type: Type.ARRAY,
            description: "The list of tasks to complete the project.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Unique integer ID for the task, starting from 1." },
                    name: { type: Type.STRING, description: "A concise name for the task." },
                    duration: { type: Type.INTEGER, description: "The estimated duration of the task in whole days." },
                    depends_on_id: { type: Type.INTEGER, description: "The ID of the task that this task depends on. Omit if no dependency." },
                    assigned_resource_id: { type: Type.INTEGER, description: "The ID of the resource assigned to this task. Omit if unassigned." },
                    is_milestone: { type: Type.BOOLEAN, description: "True if this task represents a project milestone." },
                    parent_id: { type: Type.INTEGER, description: "The ID of the parent task. Omit if it is a top-level task." },
                },
                required: ["id", "name", "duration", "is_milestone"],
            }
        }
    },
    required: ["resources", "tasks"],
};

function buildGanttPrompt(data: ProjectData, language: 'ar' | 'en'): string {
    const teamMembers = data.teamMembers.map(tm => `- ${tm.name} (${tm.role})`).join('\n');
    const milestones = data.milestones.map(m => `- ${m.name} (starts ${m.startDate}, duration: ${m.duration} working days)`).join('\n');
    const isArabic = language === 'ar';
    
    const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNamesAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const weekendDayNames = data.weekendDays
        .sort()
        .map(dayIndex => isArabic ? dayNamesAr[dayIndex] : dayNamesEn[dayIndex])
        .join(', ');

    const systemInstruction = isArabic
        ? `أنت مدير مشاريع خبير. مهمتك هي إنشاء خطة مشروع مفصلة بناءً على مدخلات المستخدم. يجب أن يكون الناتج كائن JSON يلتزم تمامًا بالمخطط المقدم. يجب أن تكون جميع أسماء المهام والموارد التي تم إنشاؤها باللغة العربية.`
        : `You are an expert project manager. Your task is to generate a detailed project plan based on the user's input. The output must be a JSON object that strictly adheres to the provided schema. All generated task and resource names must be in English.`;

    return `
    ${systemInstruction}
    
    ${isArabic ? 'تفاصيل المشروع:' : 'Project Details:'}
    - ${isArabic ? 'الاسم:' : 'Name:'} ${data.projectName}
    - ${isArabic ? 'النوع:' : 'Type:'} ${data.projectType}
    - ${isArabic ? 'الوصف:' : 'Description:'} ${data.description}
    - ${isArabic ? 'تاريخ البدء:' : 'Start Date:'} ${data.startDate}
    - ${isArabic ? 'تاريخ الانتهاء:' : 'End Date:'} ${data.endDate}
    - ${isArabic ? 'مستوى تفصيل المهام:' : 'Task Granularity:'} ${data.taskGranularity} (${isArabic ? "استخدم هذا لتحديد مدى تفصيل تقسيم المهام. 'high' يعني العديد من المهام الصغيرة، 'low' يعني عددًا أقل من المهام الكبيرة." : "Use this to decide how detailed the task breakdown should be. 'high' means many small tasks, 'low' means fewer large tasks."}).
    - ${isArabic ? 'أيام نهاية الأسبوع (غير عاملة):' : 'Weekend Days (Non-working):'} ${weekendDayNames}

    ${isArabic ? 'أعضاء الفريق / الموارد:' : 'Team Members / Resources:'}
    ${teamMembers}

    ${isArabic ? 'مراحل المشروع الرئيسية:' : 'Key Project Phases:'}
    ${milestones}

    ${isArabic ? 'التعليمات:' : 'Instructions:'}
    1.  ${isArabic ? 'أنشئ قائمة بالموارد بناءً على أعضاء الفريق المقدمين. قم بتعيين معرف رقمي فريد لكل منهم, بدءًا من 1.' : 'Create a list of resources based on the provided team members. Assign a unique integer ID to each, starting from 1.'}
    2.  ${isArabic ? 'قسّم المشروع إلى قائمة من المهام المطلوبة للانتقال من تاريخ البدء إلى تاريخ الانتهاء، وتحقيق جميع الأهداف.' : "Break down the project into a list of tasks required to get from the start date to the end date, achieving all goals."}
    3.  ${isArabic ? 'عند حساب مدة المهام والتبعيات، يجب أن تأخذ في الاعتبار أن أيام نهاية الأسبوع المحددة هي أيام غير عاملة. لا ينبغي أن تبدأ المهام أو تنتهي في هذه الأيام.' : "When calculating task durations and dependencies, you MUST account for the specified weekend days as non-working days. Tasks should not start or end on these days."}
    4.  ${isArabic ? 'قم بتعيين معرف رقمي فريد لكل مهمة، بدءًا من 1.' : "Assign a unique integer ID to each task, starting from 1."}
    5.  ${isArabic ? 'قدّر المدة بـ *الأيام* لكل مهمة. يجب أن يتناسب إجمالي مدة جميع المهام منطقيًا مع الجدول الزمني للمشروع.' : "Estimate the duration in *days* for each task. The total duration of all tasks should logically fit within the project timeline."}
    6.  ${isArabic ? "أنشئ تبعيات بين المهام. يجب أن يكون 'depends_on_id' للمهمة هو معرف المهمة التي يجب إكمالها قبل أن تبدأ. يجب ألا يكون للمهمة الأولى أي تبعية." : "Establish dependencies between tasks. A task's 'depends_on_id' should be the ID of the task that must be completed before it can start. The first task should have no dependency."}
    7.  ${isArabic ? 'قم بتعيين المهام للمورد الأنسب من القائمة باستخدام معرف المورد الخاص بهم.' : "Assign tasks to the most appropriate resource from the list using their resource ID."}
    8.  ${isArabic ? "مراحل المشروع الرئيسية المقدمة هي مراحل رئيسية. استخدمها لهيكلة خطة المشروع. أنشئ مهامًا رئيسية (بدون parent_id) لتمثيل هذه المراحل، مع احترام مدتها المحددة. قسّم هذه المراحل الرئيسية إلى مهام فرعية أصغر. يجب أن تحتوي هذه المهام الفرعية على parent_id الذي يشير إلى المهمة الرئيسية التي تنتمي إليها. يجب ألا يتم تمييز مهام المرحلة الرئيسية هذه بـ 'is_milestone' على أنها true." : "The 'Key Project Phases' provided are major phases. Use them to structure the project plan. Create main tasks (with no parent_id) to represent these phases, respecting their specified durations. Break these main phases down into smaller sub-tasks. These sub-tasks MUST have a parent_id pointing to the main phase task they belong to. These main phase tasks should NOT have 'is_milestone' set to true."}
    9.  ${isArabic ? 'تأكد من أن كائن JSON الذي تم إنشاؤه صالح وكامل.' : "Ensure the generated JSON is valid and complete."}
    `;
}

export async function generateGanttData(projectData: ProjectData, language: 'ar' | 'en'): Promise<GeneratedGanttData> {
    const prompt = buildGanttPrompt(projectData, language);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const generatedData = JSON.parse(jsonText) as GeneratedGanttData;
        
        // Basic validation of the returned data
        if (!generatedData.tasks || !generatedData.resources) {
            throw new Error("AI response is missing 'tasks' or 'resources' properties.");
        }
        
        return generatedData;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get a valid response from the AI. Please check your API key and the model's availability.");
    }
}

function buildProjectPlanPrompt(projectData: ProjectData, ganttData: GeneratedGanttData, language: 'ar' | 'en'): string {
    const isArabic = language === 'ar';

    const teamMembers = projectData.teamMembers.map(tm => `- ${tm.name} (${tm.role})`).join('\n');
    const milestones = projectData.milestones.map(m => `- ${m.name} (Start: ${m.startDate}, Duration: ${m.duration} days)`).join('\n');
    
    // Create a high-level summary of tasks
    const taskSummary = ganttData.tasks
        .filter(t => !t.parent_id) // Get only top-level tasks
        .map(t => `- ${t.name} (Duration: ${t.duration} days)`)
        .join('\n');

    const systemInstruction = isArabic
        ? `أنت مدير مشاريع متمرس ومكلف بكتابة وثيقة خطة مشروع رسمية وموجزة. يجب أن تكون الوثيقة منظمة بشكل جيد باستخدام Markdown، مع عناوين واضحة لكل قسم. اللغة المطلوبة هي العربية.`
        : `You are a senior project manager tasked with writing a formal, concise project plan document. The document should be well-structured using Markdown, with clear headings for each section. The required language is English.`;

    return `
${systemInstruction}

${isArabic ? 'بناءً على تفاصيل المشروع التالية، قم بإنشاء وثيقة خطة المشروع.' : 'Based on the following project details, generate the project plan document.'}

---

### ${isArabic ? '1. بيانات المشروع الأولية' : '1. Initial Project Data'}

*   **${isArabic ? 'اسم المشروع' : 'Project Name'}:** ${projectData.projectName}
*   **${isArabic ? 'وصف المشروع' : 'Project Description'}:** ${projectData.description}
*   **${isArabic ? 'الجدول الزمني العام' : 'Overall Timeline'}:** ${projectData.startDate} to ${projectData.endDate}

### ${isArabic ? '2. فريق المشروع والموارد' : '2. Project Team & Resources'}
${teamMembers}

### ${isArabic ? '3. المراحل الرئيسية' : '3. Key Phases / Milestones'}
${milestones}

### ${isArabic ? '4. ملخص المهام المولدة' : '4. Generated Task Summary'}
${taskSummary}

---

${isArabic ? 'التعليمات:' : 'Instructions:'}
1.  **${isArabic ? 'اكتب ملخصًا تنفيذيًا' : 'Write an Executive Summary'}:** ابدأ بفقرة موجزة تلخص المشروع وأهدافه الرئيسية.
2.  **${isArabic ? 'حدد النطاق والأهداف' : 'Define Scope and Objectives'}:** صف ما يهدف المشروع لتحقيقه وما هو خارج النطاق.
3.  **${isArabic ? 'صف الجدول الزمني والمراحل الرئيسية' : 'Outline Schedule and Milestones'}:** اشرح المراحل الرئيسية للمشروع بناءً على البيانات المقدمة.
4.  **${isArabic ? 'حدد أدوار الفريق ومسؤولياته' : 'Detail Team Roles and Responsibilities'}:** قم بتعيين مسؤوليات عامة لكل دور في الفريق.
5.  **${isArabic ? 'حافظ على الوثيقة احترافية وواضحة.' : 'Keep the document professional and clear.'}
`;
}

export async function generateProjectPlanDocument(projectData: ProjectData, ganttData: GeneratedGanttData, language: 'ar' | 'en'): Promise<string> {
    const prompt = buildProjectPlanPrompt(projectData, ganttData, language);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for project plan:", error);
        throw new Error("Failed to generate the project plan document.");
    }
}