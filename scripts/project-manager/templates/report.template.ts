// ============================================
// Project Progress Manager — Report Template
// ============================================

import type { ProjectReport } from '../types/index.js';

/**
 * Generate a complete PROJECT_REPORT.md markdown document.
 */
export function generateReportMarkdown(report: ProjectReport): string {
  const sections: string[] = [];

  // Header
  sections.push(`# 📊 Project Report — ${report.projectName}`);
  sections.push('');
  sections.push(`> Generated: ${report.generatedAt}`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Overall Progress
  sections.push('## 📈 Overall Progress');
  sections.push('');
  sections.push(`**${report.overallProgress}%** complete`);
  sections.push('');

  // Phase Progress Table
  sections.push('### Phase Progress');
  sections.push('');
  sections.push('| Phase | Progress |');
  sections.push('|-------|----------|');
  for (const phase of report.state.phases) {
    sections.push(`| ${phase.name} | ${phase.percentage}% |`);
  }
  sections.push('');
  sections.push('---');
  sections.push('');

  // Current Status
  sections.push('## 📍 Current Status');
  sections.push('');
  sections.push(`- **Current Phase:** ${report.state.currentPhase}`);
  sections.push(`- **Current Document:** ${report.state.currentDocument}`);
  sections.push(`- **Current Task:** ${report.state.currentTask}`);
  sections.push(`- **Next Task:** ${report.state.nextTask}`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Documentation Progress
  sections.push('## 📚 Documentation Progress');
  sections.push('');
  sections.push('| # | Document | Status |');
  sections.push('|---|----------|--------|');
  for (const doc of report.state.documents) {
    const statusIcon =
      doc.status === 'completed' ? '✅' : doc.status === 'in-progress' ? '🟡' : '⬜';
    const statusLabel =
      doc.status === 'completed'
        ? 'Completed'
        : doc.status === 'in-progress'
          ? 'In Progress'
          : 'Not Started';
    const paddedNum = String(doc.number).padStart(2, '0');
    sections.push(`| ${paddedNum} | ${doc.name} | ${statusIcon} ${statusLabel} |`);
  }
  sections.push('');
  sections.push('---');
  sections.push('');

  // Git Information
  if (report.git) {
    sections.push('## 🔀 Git Status');
    sections.push('');
    sections.push(`- **Branch:** ${report.git.branch}`);
    sections.push(`- **Last Commit:** ${report.git.lastCommit}`);
    sections.push(`- **Commit Hash:** ${report.git.lastCommitHash}`);
    sections.push(`- **Author:** ${report.git.lastCommitAuthor}`);
    sections.push(`- **Status:** ${report.git.isClean ? '✅ Clean' : '🟡 Uncommitted changes'}`);

    if (report.git.modifiedFiles.length > 0) {
      sections.push('');
      sections.push('### Modified Files');
      sections.push('');
      for (const file of report.git.modifiedFiles.slice(0, 20)) {
        sections.push(`- ${file}`);
      }
      if (report.git.modifiedFiles.length > 20) {
        sections.push(`- _...and ${report.git.modifiedFiles.length - 20} more_`);
      }
    }
    sections.push('');
    sections.push('---');
    sections.push('');
  }

  // Validation Results
  sections.push('## ✅ Validation Results');
  sections.push('');
  const passed = report.validations.filter((v) => v.passed).length;
  const failed = report.validations.filter((v) => !v.passed).length;
  sections.push(`**${passed}** passed  |  **${failed}** failed`);
  sections.push('');

  if (failed > 0) {
    sections.push('### Issues Found');
    sections.push('');
    sections.push('| Category | Check | Severity | Message |');
    sections.push('|----------|-------|----------|---------|');
    for (const v of report.validations.filter((v) => !v.passed)) {
      const sevIcon = v.severity === 'error' ? '🔴' : v.severity === 'warning' ? '🟡' : '🔵';
      sections.push(`| ${v.category} | ${v.check} | ${sevIcon} ${v.severity} | ${v.message} |`);
    }
    sections.push('');
  }
  sections.push('---');
  sections.push('');

  // Decisions
  sections.push('## 🧠 Decisions');
  sections.push('');
  sections.push('### Approved');
  sections.push('');
  if (report.state.recentDecisions.length > 0) {
    for (const d of report.state.recentDecisions) {
      sections.push(`- ✅ **#${String(d.number).padStart(3, '0')}** — ${d.description}`);
    }
  } else {
    sections.push('_No approved decisions yet._');
  }
  sections.push('');
  sections.push('### Pending');
  sections.push('');
  if (report.state.pendingDecisions.length > 0) {
    for (const d of report.state.pendingDecisions) {
      sections.push(`- ⏳ ${d}`);
    }
  } else {
    sections.push('_No pending decisions._');
  }
  sections.push('');
  sections.push('---');
  sections.push('');

  // Recommendations
  sections.push('## 💡 Recommendations');
  sections.push('');
  for (const rec of report.recommendations) {
    sections.push(`- ${rec}`);
  }
  sections.push('');
  sections.push('---');
  sections.push('');

  // Milestones
  sections.push('## 🎯 Milestones');
  sections.push('');
  sections.push(`- **Current:** ${report.state.milestones.current}`);
  sections.push(`- **Next:** ${report.state.milestones.next}`);
  sections.push('');
  if (report.state.milestones.completed.length > 0) {
    sections.push('### Completed Milestones');
    sections.push('');
    for (const m of report.state.milestones.completed) {
      sections.push(`- ✅ ${m}`);
    }
  }
  sections.push('');
  sections.push('---');
  sections.push('');
  sections.push(`_Report generated by Project Progress Manager (PPM)_`);
  sections.push('');

  return sections.join('\n');
}
