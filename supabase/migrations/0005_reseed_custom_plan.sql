-- Replaces the default GATE CSE topic list with a personalized 6-month +
-- 1 free-revision-month plan (GATE 2027 target), per context.md. This is a
-- full reseed: deletes the existing topics for the GATE CSE syllabus and
-- inserts a new, coarser-grained set (39 topics matching the plan's own
-- weekly blocks, not the original 176 fine-grained items).
--
-- Safe to run only because there is no existing user_topic_progress,
-- notes, or chat_history tied to the old topics at the time this was
-- written — deleting topics cascades to progress/notes and nulls out
-- chat_history.topic_id. If you're running this later with real progress
-- data in place, back it up first; this migration does not attempt to
-- preserve or remap it.
--
-- month is 1-7 (July 2026 through January 2027); week_number resets each
-- month and follows the plan's own row order (not raw calendar-week spans
-- — a block spanning two calendar weeks is still one row here, with the
-- calendar detail folded into the title text).

do $$
declare
  v_syllabus_id uuid;
begin
  select id into v_syllabus_id from public.syllabi where name = 'GATE CSE';

  if v_syllabus_id is null then
    raise exception 'GATE CSE syllabus not found — run 0002_seed_gate_cse.sql first';
  end if;

  delete from public.topics where syllabus_id = v_syllabus_id;

  insert into public.topics (syllabus_id, subject, title, month, week_number, order_index) values
    -- Month 1 — July (paper priority, GATE light: 1-1.5 hrs/day)
    (v_syllabus_id, 'Discrete Mathematics', 'Weeks 1-2: Propositional & predicate logic, sets, relations, functions, partial orders, lattices', 1, 1, 1),
    (v_syllabus_id, 'General Aptitude', 'Weekly practice (July) - 20-30 min, 3-4x/week - light month, paper priority', 1, 1, 2),
    (v_syllabus_id, 'Discrete Mathematics', 'Weeks 3-4: Graphs & combinatorics', 1, 2, 3),
    (v_syllabus_id, 'Digital Logic', 'Weeks 3-4: Boolean algebra, K-maps, combinational circuits', 1, 2, 4),

    -- Month 2 — August (paper wraps, ramp to full intensity)
    (v_syllabus_id, 'Digital Logic', 'Finish: sequential circuits, memory/number representation', 2, 1, 5),
    (v_syllabus_id, 'General Aptitude', 'Weekly practice (August) - 20-30 min, 3-4x/week', 2, 1, 6),
    (v_syllabus_id, 'Exam Logistics', 'Register for GATE 2027 (portal opens this month) + buffer for paper submission', 2, 2, 7),
    (v_syllabus_id, 'Engineering Mathematics', 'Linear Algebra + Calculus', 2, 3, 8),
    (v_syllabus_id, 'Engineering Mathematics', 'Probability & Statistics', 2, 4, 9),

    -- Month 3 — September (Programming, Data Structures, Algorithms)
    (v_syllabus_id, 'Programming & Data Structures', 'Programming fundamentals: recursion, functions, pointers, control flow', 3, 1, 10),
    (v_syllabus_id, 'General Aptitude', 'Weekly practice (September) - 20-30 min, 3-4x/week', 3, 1, 11),
    (v_syllabus_id, 'Programming & Data Structures', 'Data Structures: arrays, stacks, queues, linked lists, trees, BSTs, heaps, hashing', 3, 2, 12),
    (v_syllabus_id, 'Algorithms', 'Asymptotic complexity, searching, sorting', 3, 3, 13),
    (v_syllabus_id, 'Algorithms', 'Greedy, divide-and-conquer, dynamic programming, graph algorithms (MST, shortest path)', 3, 4, 14),
    (v_syllabus_id, 'Revision & Mock Tests', 'Start weekly PYQ sets (September) on completed topics, from this week onward', 3, 4, 15),

    -- Month 4 — October (Systems: Architecture + OS)
    (v_syllabus_id, 'Computer Organization & Architecture', 'Instructions, addressing modes, ALU/datapath', 4, 1, 16),
    (v_syllabus_id, 'General Aptitude', 'Weekly practice (October) - 20-30 min, 3-4x/week', 4, 1, 17),
    (v_syllabus_id, 'Computer Organization & Architecture', 'Pipelining, memory hierarchy, cache, I/O', 4, 2, 18),
    (v_syllabus_id, 'Operating Systems', 'Processes, threads, IPC, concurrency, synchronization', 4, 3, 19),
    (v_syllabus_id, 'Operating Systems', 'Deadlock, CPU scheduling, memory management, file systems', 4, 4, 20),
    (v_syllabus_id, 'Revision & Mock Tests', 'Weekly PYQ practice (October) - solve PYQs for every topic completed this month', 4, 4, 21),

    -- Month 5 — November (Networks, Databases, start TOC)
    (v_syllabus_id, 'Computer Networks', 'Layering model, data link layer', 5, 1, 22),
    (v_syllabus_id, 'General Aptitude', 'Weekly practice (November) - 20-30 min, 3-4x/week', 5, 1, 23),
    (v_syllabus_id, 'Computer Networks', 'Routing, transport layer (TCP/UDP), application layer', 5, 2, 24),
    (v_syllabus_id, 'Databases', 'ER model, relational algebra/calculus, SQL', 5, 3, 25),
    (v_syllabus_id, 'Databases', 'Normalization, indexing, transactions', 5, 4, 26),
    (v_syllabus_id, 'Theory of Computation', 'Start TOC: finite automata, regular languages', 5, 4, 27),
    (v_syllabus_id, 'Revision & Mock Tests', 'Weekly PYQ practice (November) - solve PYQs for every topic completed this month', 5, 4, 28),

    -- Month 6 — December (finish TOC + Compiler Design + first full revision pass)
    (v_syllabus_id, 'Theory of Computation', 'Finish TOC: context-free grammars, pushdown automata, Turing machines, decidability', 6, 1, 29),
    (v_syllabus_id, 'General Aptitude', 'Weekly practice (December) - 20-30 min, 3-4x/week', 6, 1, 30),
    (v_syllabus_id, 'Compiler Design', 'Lexical/syntax/semantic analysis, parsing (top-down, bottom-up)', 6, 2, 31),
    (v_syllabus_id, 'Compiler Design', 'Code generation, optimization', 6, 3, 32),
    (v_syllabus_id, 'Revision & Mock Tests', 'Begin full-syllabus revision pass', 6, 3, 33),
    (v_syllabus_id, 'Revision & Mock Tests', 'Full revision continues, subject-wise PYQ sets for every section, first full-length mock', 6, 4, 34),
    (v_syllabus_id, 'Revision & Mock Tests', 'Weekly PYQ practice (December) - solve PYQs for every topic completed this month', 6, 4, 35),

    -- Month 7 — January (fully free: revision + mocks, no new content)
    (v_syllabus_id, 'Revision & Mock Tests', 'Full-length mocks (2-3) + error log review - identify weak subjects from Month 6 mock data', 7, 1, 36),
    (v_syllabus_id, 'Revision & Mock Tests', 'Targeted revision on weak areas only, more mocks (2-3), formula/concept sheets', 7, 2, 37),
    (v_syllabus_id, 'Revision & Mock Tests', 'Mixed PYQ drills across all years, timed sectional tests, final mocks', 7, 3, 38),
    (v_syllabus_id, 'Revision & Mock Tests', 'Exam week: light revision only - formula sheets, past mistakes log, no new problems, prioritize sleep and routine', 7, 4, 39);
end $$;
