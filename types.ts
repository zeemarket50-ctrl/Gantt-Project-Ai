
export interface TeamMember {
    id: string;
    name: string;
    role: string;
}

export interface Milestone {
    id:string;
    name: string;
    startDate: string;
    duration: number; // in days
}

export interface ProjectData {
    projectName: string;
    projectType: 'campaign' | 'ecommerce' | 'software' | 'construction' | 'event' | 'research' | 'content' | 'education' | 'custom';
    description: string;
    startDate: string;
    endDate: string;
    teamMembers: TeamMember[];
    milestones: Milestone[];
    weekendDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    taskGranularity: 'high' | 'medium' | 'low';
}

// Types for the data structure expected from the Gemini API
export interface GeneratedTask {
    id: number;
    name: string;
    duration: number; // in days
    depends_on_id?: number;
    assigned_resource_id?: number;
    is_milestone: boolean;
    parent_id?: number;
}

export interface GeneratedResource {
    id: number;
    name: string;
    role: string;
}

export interface GeneratedGanttData {
    tasks: GeneratedTask[];
    resources: GeneratedResource[];
}