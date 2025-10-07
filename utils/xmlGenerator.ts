
import type { ProjectData, GeneratedGanttData, GeneratedTask } from '../types';

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export function generateGanttXML(projectData: ProjectData, ganttData: GeneratedGanttData): string {
    const projectStartDate = projectData.startDate;

    const tasksById = new Map(ganttData.tasks.map(task => [task.id, task]));
    const childrenByParentId = new Map<number, GeneratedTask[]>();
    const rootTasks: GeneratedTask[] = [];

    for (const task of ganttData.tasks) {
        if (task.parent_id && tasksById.has(task.parent_id)) {
            const children = childrenByParentId.get(task.parent_id) || [];
            children.push(task);
            childrenByParentId.set(task.parent_id, children);
        } else {
            rootTasks.push(task);
        }
    }

    const taskDates = new Map<number, { start: Date; end: Date }>();
    const sortedTasks = [...ganttData.tasks].sort((a, b) => a.id - b.id);
    
    // This date calculation logic is a baseline. GanttProject recalculates upon opening.
    for (const task of sortedTasks) {
        let startDate: Date;
        if (task.depends_on_id && taskDates.has(task.depends_on_id)) {
            const predecessorEndDate = taskDates.get(task.depends_on_id)!.end;
            startDate = new Date(predecessorEndDate);
            startDate.setDate(startDate.getDate() + 1);
        } else if (task.parent_id && taskDates.has(task.parent_id)) {
             // If no dependency, a child task can start with its parent.
            startDate = new Date(taskDates.get(task.parent_id)!.start);
        } else {
            startDate = new Date(projectStartDate);
        }

        const duration = task.duration > 0 ? task.duration : 1;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        
        taskDates.set(task.id, { start: startDate, end: endDate });
    }

    const generateTaskXmlRecursive = (task: GeneratedTask): string => {
        const startDate = taskDates.get(task.id)?.start.toISOString().split('T')[0] || projectStartDate;
        const startAttr = `start="${startDate}"`;
        const durationAttr = `duration="${task.duration}"`;
        const milestoneAttr = task.is_milestone ? 'milestone="true"' : '';
        const dependsAttr = task.depends_on_id ? `depends="${task.depends_on_id}"` : '';
        
        const children = childrenByParentId.get(task.id);

        let xml = `    <task id="${task.id}" name="${escapeXml(task.name)}" ${startAttr} ${durationAttr} ${milestoneAttr} ${dependsAttr}`;

        if (children && children.length > 0) {
            xml += `>\n`;
            for (const child of children.sort((a, b) => a.id - b.id)) {
                xml += generateTaskXmlRecursive(child);
            }
            xml += `    </task>\n`;
        } else {
            xml += `/>\n`;
        }
        return xml;
    };

    const taskXml = rootTasks.sort((a, b) => a.id - b.id).map(generateTaskXmlRecursive).join('');

    let resourceXml = '';
    for (const resource of ganttData.resources) {
        resourceXml += `    <resource id="${resource.id}" name="${escapeXml(resource.name)}"/>\n`;
    }
    
    let assignmentXml = '';
    for (const task of ganttData.tasks) {
        if (task.assigned_resource_id) {
            assignmentXml += `    <assignment task-id="${task.id}" resource-id="${task.assigned_resource_id}"/>\n`;
        }
    }

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekDef = dayNames.map((day, index) => {
        const isOff = projectData.weekendDays.includes(index);
        return `${day}="${isOff ? 'true' : 'false'}"`;
    }).join(' ');

    const calendarXml = `
  <calendars>
    <calendar id="1">
        <default-week ${weekDef}/>
    </calendar>
  </calendars>`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<project name="${escapeXml(projectData.projectName)}" company="GanttGen AI" version="2.8.10">
  <tasks>
${taskXml}
  </tasks>
  <resources>
${resourceXml}
  </resources>
  <assignments>
${assignmentXml}
  </assignments>
${calendarXml}
</project>`;

    return xml;
}