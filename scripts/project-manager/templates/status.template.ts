// ============================================
// Project Progress Manager — Status Dashboard Template
// ============================================

import chalk from 'chalk';
import Table from 'cli-table3';
import { CLI_COLORS, TIMELINE_ICONS } from '../constants/index.js';
import type { ProjectState, GitInfo } from '../types/index.js';
import {
  createHeaderBox,
  createDivider,
  createProgressBar,
  createSectionTitle,
  formatDocName,
  formatPercentage,
} from '../utils/format-utils.js';

/**
 * Render the complete terminal dashboard.
 */
export function renderDashboard(
  state: ProjectState,
  git: GitInfo | null,
  overallProgress: number,
): void {
  console.log();

  // ── Header Box ──
  console.log(createHeaderBox(state.projectName, 'Project Progress Dashboard'));
  console.log();

  // ── Current Phase & Document ──
  console.log(createSectionTitle('📍', 'Current Status'));
  console.log();
  console.log(
    `  ${chalk.hex(CLI_COLORS.muted)('Phase:')}         ${chalk.hex(CLI_COLORS.primary).bold(state.currentPhase)}`,
  );
  console.log(
    `  ${chalk.hex(CLI_COLORS.muted)('Document:')}      ${chalk.hex(CLI_COLORS.warning).bold(state.currentDocument)}`,
  );
  console.log(
    `  ${chalk.hex(CLI_COLORS.muted)('Status:')}        ${state.currentDocumentStatus}`,
  );
  console.log();

  // ── Progress Bars ──
  console.log(createSectionTitle('📊', 'Phase Progress'));
  console.log();

  const progressTable = new Table({
    chars: {
      top: '', 'top-mid': '', 'top-left': '', 'top-right': '',
      bottom: '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      left: '  ', 'left-mid': '', mid: '', 'mid-mid': '',
      right: '', 'right-mid': '', middle: ' ',
    },
    style: { 'padding-left': 0, 'padding-right': 1 },
  });

  for (const phase of state.phases) {
    progressTable.push([
      chalk.hex(CLI_COLORS.muted)(phase.name.padEnd(14)),
      createProgressBar(phase.percentage, 25),
    ]);
  }

  console.log(progressTable.toString());
  console.log();

  // ── Document Status ──
  console.log(createSectionTitle('📚', 'Documentation'));
  console.log();

  // Completed documents
  const completed = state.documents.filter((d) => d.status === 'completed');
  if (completed.length > 0) {
    console.log(`  ${chalk.hex(CLI_COLORS.success).bold('Completed')}`);
    for (const doc of completed) {
      console.log(
        `    ${chalk.hex(CLI_COLORS.success)(TIMELINE_ICONS.completed)} ${chalk.hex(CLI_COLORS.success)(formatDocName(doc.number, doc.name))}`,
      );
    }
    console.log();
  }

  // In-progress document
  const inProgress = state.documents.filter((d) => d.status === 'in-progress');
  if (inProgress.length > 0) {
    console.log(`  ${chalk.hex(CLI_COLORS.warning).bold('In Progress')}`);
    for (const doc of inProgress) {
      console.log(
        `    ${chalk.hex(CLI_COLORS.warning)(TIMELINE_ICONS['in-progress'])} ${chalk.hex(CLI_COLORS.warning).bold(formatDocName(doc.number, doc.name))}`,
      );
    }
    console.log();
  }

  // Next documents (show next 3)
  const notStarted = state.documents.filter((d) => d.status === 'not-started');
  if (notStarted.length > 0) {
    console.log(`  ${chalk.hex(CLI_COLORS.muted).bold('Upcoming')}`);
    const nextThree = notStarted.slice(0, 3);
    for (const doc of nextThree) {
      console.log(
        `    ${chalk.hex(CLI_COLORS.muted)(TIMELINE_ICONS['not-started'])} ${chalk.hex(CLI_COLORS.muted)(formatDocName(doc.number, doc.name))}`,
      );
    }
    if (notStarted.length > 3) {
      console.log(
        `    ${chalk.hex(CLI_COLORS.muted)(`  ...and ${notStarted.length - 3} more`)}`,
      );
    }
    console.log();
  }

  // ── Overall Progress ──
  console.log(createSectionTitle('🎯', 'Overall Progress'));
  console.log();
  console.log(`  ${createProgressBar(overallProgress, 35)}`);
  console.log(
    `  ${chalk.hex(CLI_COLORS.muted)(`${completed.length}/${state.documents.length} documents completed`)}`,
  );
  console.log();

  // ── Milestones ──
  console.log(createSectionTitle('🏗', 'Milestones'));
  console.log();
  console.log(
    `  ${chalk.hex(CLI_COLORS.muted)('Current:')}  ${chalk.white.bold(state.milestones.current)}`,
  );
  console.log(
    `  ${chalk.hex(CLI_COLORS.muted)('Next:')}     ${chalk.hex(CLI_COLORS.info)(state.milestones.next)}`,
  );
  console.log();

  // ── Decisions Summary ──
  console.log(createSectionTitle('🧠', 'Decisions'));
  console.log();
  console.log(
    `  ${chalk.hex(CLI_COLORS.success)(`${state.recentDecisions.length} approved`)}  ${chalk.hex(CLI_COLORS.muted)('|')}  ${chalk.hex(CLI_COLORS.warning)(`${state.pendingDecisions.length} pending`)}`,
  );
  console.log();

  // ── Git Info ──
  if (git) {
    console.log(createSectionTitle('🔀', 'Git'));
    console.log();
    console.log(
      `  ${chalk.hex(CLI_COLORS.muted)('Branch:')}   ${chalk.hex(CLI_COLORS.primary).bold(git.branch)}`,
    );
    console.log(
      `  ${chalk.hex(CLI_COLORS.muted)('Commit:')}   ${chalk.white(git.lastCommit)} ${chalk.hex(CLI_COLORS.muted)(`(${git.lastCommitHash})`)}`,
    );
    console.log(
      `  ${chalk.hex(CLI_COLORS.muted)('Status:')}   ${git.isClean ? chalk.hex(CLI_COLORS.success)('✔ Clean') : chalk.hex(CLI_COLORS.warning)(`${git.modifiedFiles.length} modified`)}`,
    );
    console.log();
  }

  // ── Footer ──
  console.log(createDivider(55));
  console.log(
    chalk.hex(CLI_COLORS.muted)(
      '  Run ') +
    chalk.hex(CLI_COLORS.info)('npm run project:help') +
    chalk.hex(CLI_COLORS.muted)(' to see all commands'),
  );
  console.log();
}
