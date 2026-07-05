-- Expands the coarse-grained (39-row) plan from 0005 into granular,
-- line-by-line topics matching the official GATE 2026 CSE syllabus PDF
-- exactly, so every syllabus item has its own trackable row (nothing folded
-- into a combined title, and the Discrete Mathematics "Monoids, Groups"
-- item that 0005 had dropped is restored).
--
-- Subject names, months and week numbers are unchanged from 0005 — only
-- each subject's per-week block is split into one row per syllabus line.
-- General Aptitude / Exam Logistics / Revision & Mock Tests rows (not part
-- of the syllabus) are carried over verbatim.
--
-- Full reseed, same pattern as 0005: deletes all topics for the syllabus
-- and reinserts. This cascades to user_topic_progress, notes, and
-- user_topic_schedule for every existing topic (nulls chat_history.topic_id)
-- — accepted here per explicit instruction, not something to rerun blindly
-- later once real progress exists again.

do $$
declare
  v_syllabus_id uuid;
begin
  select id into v_syllabus_id from public.syllabi where name = 'GATE CSE';

  if v_syllabus_id is null then
    raise exception 'GATE CSE syllabus not found — run 0002_seed_gate_cse.sql first';
  end if;

  delete from public.topics where syllabus_id = v_syllabus_id;

  insert into public.topics (syllabus_id, subject_id, title, month, week_number, order_index)
  select v_syllabus_id, s.id, t.title, t.month, t.week_number, t.order_index
  from (
    values
      -- Month 1 — July
      ('Discrete Mathematics', 'Propositional and first order logic', 1, 1, 1),
      ('Discrete Mathematics', 'Sets, relations, functions, partial orders and lattices', 1, 1, 2),
      ('Discrete Mathematics', 'Monoids, Groups', 1, 1, 3),
      ('General Aptitude', 'Weekly practice (July) - 20-30 min, 3-4x/week - light month, paper priority', 1, 1, 4),
      ('Discrete Mathematics', 'Graphs: connectivity, matching, colouring', 1, 2, 5),
      ('Discrete Mathematics', 'Combinatorics: counting, recurrence relations, generating functions', 1, 2, 6),
      ('Digital Logic', 'Boolean algebra', 1, 2, 7),
      ('Digital Logic', 'Combinational circuits', 1, 2, 8),
      ('Digital Logic', 'Minimization (Boolean function minimization, K-maps)', 1, 2, 9),

      -- Month 2 — August
      ('Digital Logic', 'Sequential circuits', 2, 1, 10),
      ('Digital Logic', 'Number representations and computer arithmetic (fixed and floating point)', 2, 1, 11),
      ('General Aptitude', 'Weekly practice (August) - 20-30 min, 3-4x/week', 2, 1, 12),
      ('Exam Logistics', 'Register for GATE 2027 (portal opens this month) + buffer for paper submission', 2, 2, 13),
      ('Engineering Mathematics', 'Linear Algebra: matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition', 2, 3, 14),
      ('Engineering Mathematics', 'Calculus: limits, continuity and differentiability, maxima and minima, mean value theorem, integration', 2, 3, 15),
      ('Engineering Mathematics', 'Probability: random variables, uniform, normal, exponential, Poisson and binomial distributions', 2, 4, 16),
      ('Engineering Mathematics', 'Statistics: mean, median, mode and standard deviation; conditional probability and Bayes theorem', 2, 4, 17),

      -- Month 3 — September
      ('Programming & Data Structures', 'Programming in C', 3, 1, 18),
      ('Programming & Data Structures', 'Recursion', 3, 1, 19),
      ('General Aptitude', 'Weekly practice (September) - 20-30 min, 3-4x/week', 3, 1, 20),
      ('Programming & Data Structures', 'Arrays, stacks, queues, linked lists', 3, 2, 21),
      ('Programming & Data Structures', 'Trees, binary search trees, binary heaps', 3, 2, 22),
      ('Programming & Data Structures', 'Graphs (as a data structure)', 3, 2, 23),
      ('Algorithms', 'Searching, sorting, hashing', 3, 3, 24),
      ('Algorithms', 'Asymptotic worst case time and space complexity', 3, 3, 25),
      ('Algorithms', 'Algorithm design techniques: greedy, dynamic programming, divide-and-conquer', 3, 4, 26),
      ('Algorithms', 'Graph traversals, minimum spanning trees, shortest paths', 3, 4, 27),
      ('Revision & Mock Tests', 'Start weekly PYQ sets (September) on completed topics, from this week onward', 3, 4, 28),

      -- Month 4 — October
      ('Computer Organization & Architecture', 'Machine instructions and addressing modes', 4, 1, 29),
      ('Computer Organization & Architecture', 'ALU, data-path and control unit', 4, 1, 30),
      ('General Aptitude', 'Weekly practice (October) - 20-30 min, 3-4x/week', 4, 1, 31),
      ('Computer Organization & Architecture', 'Instruction pipelining, pipeline hazards', 4, 2, 32),
      ('Computer Organization & Architecture', 'Memory hierarchy: cache, main memory and secondary storage', 4, 2, 33),
      ('Computer Organization & Architecture', 'I/O interface (interrupt and DMA mode)', 4, 2, 34),
      ('Operating Systems', 'System calls, processes, threads, inter-process communication', 4, 3, 35),
      ('Operating Systems', 'Concurrency and synchronization', 4, 3, 36),
      ('Operating Systems', 'Deadlock', 4, 4, 37),
      ('Operating Systems', 'CPU and I/O scheduling', 4, 4, 38),
      ('Operating Systems', 'Memory management and virtual memory', 4, 4, 39),
      ('Operating Systems', 'File systems', 4, 4, 40),
      ('Revision & Mock Tests', 'Weekly PYQ practice (October) - solve PYQs for every topic completed this month', 4, 4, 41),

      -- Month 5 — November
      ('Computer Networks', 'Concept of layering: OSI and TCP/IP protocol stacks; basics of packet, circuit and virtual circuit-switching', 5, 1, 42),
      ('Computer Networks', 'Data link layer: framing, error detection, Medium Access Control, Ethernet bridging', 5, 1, 43),
      ('General Aptitude', 'Weekly practice (November) - 20-30 min, 3-4x/week', 5, 1, 44),
      ('Computer Networks', 'Routing protocols: shortest path, flooding, distance vector and link state routing', 5, 2, 45),
      ('Computer Networks', 'Fragmentation and IP addressing, IPv4, CIDR notation, basics of IP support protocols (ARP, DHCP, ICMP), NAT', 5, 2, 46),
      ('Computer Networks', 'Transport layer: flow control and congestion control, UDP, TCP, sockets', 5, 2, 47),
      ('Computer Networks', 'Application layer protocols: DNS, SMTP, HTTP, FTP, Email', 5, 2, 48),
      ('Databases', 'ER-model', 5, 3, 49),
      ('Databases', 'Relational model: relational algebra, tuple calculus, SQL', 5, 3, 50),
      ('Databases', 'Integrity constraints, normal forms', 5, 4, 51),
      ('Databases', 'File organization, indexing (B and B+ trees)', 5, 4, 52),
      ('Databases', 'Transactions and concurrency control', 5, 4, 53),
      ('Theory of Computation', 'Regular expressions and finite automata', 5, 4, 54),
      ('Revision & Mock Tests', 'Weekly PYQ practice (November) - solve PYQs for every topic completed this month', 5, 4, 55),

      -- Month 6 — December
      ('Theory of Computation', 'Context-free grammars and push-down automata', 6, 1, 56),
      ('Theory of Computation', 'Regular and context-free languages, pumping lemma', 6, 1, 57),
      ('Theory of Computation', 'Turing machines and undecidability', 6, 1, 58),
      ('General Aptitude', 'Weekly practice (December) - 20-30 min, 3-4x/week', 6, 1, 59),
      ('Compiler Design', 'Lexical analysis, parsing, syntax-directed translation', 6, 2, 60),
      ('Compiler Design', 'Runtime environments', 6, 2, 61),
      ('Compiler Design', 'Intermediate code generation', 6, 3, 62),
      ('Compiler Design', 'Local optimization; data flow analyses: constant propagation, liveness analysis, common sub-expression elimination', 6, 3, 63),
      ('Revision & Mock Tests', 'Begin full-syllabus revision pass', 6, 3, 64),
      ('Revision & Mock Tests', 'Full revision continues, subject-wise PYQ sets for every section, first full-length mock', 6, 4, 65),
      ('Revision & Mock Tests', 'Weekly PYQ practice (December) - solve PYQs for every topic completed this month', 6, 4, 66),

      -- Month 7 — January (fully free: revision + mocks, no new content)
      ('Revision & Mock Tests', 'Full-length mocks (2-3) + error log review - identify weak subjects from Month 6 mock data', 7, 1, 67),
      ('Revision & Mock Tests', 'Targeted revision on weak areas only, more mocks (2-3), formula/concept sheets', 7, 2, 68),
      ('Revision & Mock Tests', 'Mixed PYQ drills across all years, timed sectional tests, final mocks', 7, 3, 69),
      ('Revision & Mock Tests', 'Exam week: light revision only - formula sheets, past mistakes log, no new problems, prioritize sleep and routine', 7, 4, 70)
  ) as t(subject_name, title, month, week_number, order_index)
  join public.subjects s on s.syllabus_id = v_syllabus_id and s.name = t.subject_name;

  if (select count(*) from public.topics where syllabus_id = v_syllabus_id) <> 70 then
    raise exception 'expected 70 topics after reseed, got %', (select count(*) from public.topics where syllabus_id = v_syllabus_id);
  end if;
end $$;
