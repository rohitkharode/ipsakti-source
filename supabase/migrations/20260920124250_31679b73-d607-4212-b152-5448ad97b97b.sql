
create extension if not exists vector;

create table public.sources (
  id text primary key,
  name text not null,
  publisher text not null,
  authority_level int not null default 3,
  authority_label text not null default 'Official regulatory publication',
  jurisdiction text not null,
  document_type text not null,
  version text not null,
  effective_date date,
  retrieved_at timestamptz not null default now(),
  official_url text,
  verification_status text not null default 'verified',
  topics text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.documents (
  id text primary key,
  source_id text not null references public.sources(id) on delete cascade,
  title text not null,
  version text not null,
  document_hash text,
  effective_date date,
  retrieved_at timestamptz not null default now(),
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create table public.evidence_chunks (
  id text primary key,
  document_id text not null references public.documents(id) on delete cascade,
  source_id text not null references public.sources(id) on delete cascade,
  section text not null,
  page text,
  topic text not null,
  tags text[] not null default '{}',
  jurisdiction text not null,
  effective_date date,
  version text not null,
  authority_level int not null default 3,
  text text not null,
  language text not null default 'en',
  embedding vector(3072),
  search tsvector generated always as (to_tsvector('english', coalesce(section,'') || ' ' || coalesce(topic,'') || ' ' || coalesce(text,''))) stored,
  created_at timestamptz not null default now()
);

create index evidence_chunks_search_idx on public.evidence_chunks using gin (search);
create index evidence_chunks_jurisdiction_idx on public.evidence_chunks (jurisdiction);
create index evidence_chunks_embedding_idx on public.evidence_chunks using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  case_ref text not null unique,
  user_id uuid,
  product jsonb not null,
  language text not null default 'en',
  status text not null default 'processing',
  reviewer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  analysis_ref text not null unique,
  case_id uuid not null references public.cases(id) on delete cascade,
  status text not null default 'processing',
  language text not null default 'en',
  classification jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  routes jsonb not null default '{}'::jsonb,
  explanation jsonb not null default '{}'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  confidence numeric,
  confidence_label text,
  abstained boolean not null default false,
  review jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  title text not null,
  description text not null,
  priority text not null default 'Medium',
  status text not null default 'pending',
  evidence_id text,
  owner text,
  due_date date,
  notes text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_requests (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  level text not null default 'recommended',
  reason text not null,
  action text not null,
  packet jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  requested_by text,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete cascade,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_case_idx on public.audit_events (case_id, created_at);
create index checklist_items_analysis_idx on public.checklist_items (analysis_id, position);
create index analyses_case_idx on public.analyses (case_id);

grant select on public.sources to anon, authenticated;
grant select on public.documents to anon, authenticated;
grant select on public.evidence_chunks to anon, authenticated;
grant all on public.sources to service_role;
grant all on public.documents to service_role;
grant all on public.evidence_chunks to service_role;
grant all on public.cases to service_role;
grant all on public.analyses to service_role;
grant all on public.checklist_items to service_role;
grant all on public.review_requests to service_role;
grant all on public.audit_events to service_role;

alter table public.sources enable row level security;
alter table public.documents enable row level security;
alter table public.evidence_chunks enable row level security;
alter table public.cases enable row level security;
alter table public.analyses enable row level security;
alter table public.checklist_items enable row level security;
alter table public.review_requests enable row level security;
alter table public.audit_events enable row level security;

create policy "Evidence corpus is publicly readable" on public.sources for select to anon, authenticated using (true);
create policy "Documents are publicly readable" on public.documents for select to anon, authenticated using (true);
create policy "Evidence records are publicly readable" on public.evidence_chunks for select to anon, authenticated using (true);

create or replace function public.match_evidence(query_embedding vector(3072), match_count int default 8)
returns table (id text, similarity double precision)
language sql stable
set search_path = public
as $$
  select e.id, 1 - (e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) as similarity
  from public.evidence_chunks e
  where e.embedding is not null
  order by e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
$$;

insert into public.sources (id, name, publisher, authority_level, authority_label, jurisdiction, document_type, version, effective_date, official_url, verification_status, topics) values
('SRC-FSSAI-AAHARA', 'Food Safety and Standards (Ayurveda Aahara) Regulations, 2022', 'Food Safety and Standards Authority of India', 1, 'Primary official source', 'India', 'Regulation', '2022 notification', '2022-05-05', 'https://www.fssai.gov.in/', 'verified', array['Food classification','Claims','Labelling','Ayurveda Aahara']),
('SRC-FSSAI-CLAIMS', 'Food Safety and Standards (Advertising and Claims) Regulations, 2018', 'Food Safety and Standards Authority of India', 1, 'Primary official source', 'India', 'Regulation', '2018 notification', '2018-11-19', 'https://www.fssai.gov.in/', 'verified', array['Claims','Advertising','Labelling']),
('SRC-API', 'Ayurvedic Pharmacopoeia of India', 'Ministry of Ayush, Government of India', 2, 'Official regulatory publication', 'India', 'Pharmacopoeia', 'Part I collection', '1989-01-01', 'https://www.ayush.gov.in/', 'verified', array['Ingredient identity','Formulations','Quality standards']),
('SRC-DCA-ASU', 'Drugs and Cosmetics Act, 1940 and Rules — Ayurvedic, Siddha and Unani provisions', 'Ministry of Health and Family Welfare / Ministry of Ayush', 1, 'Primary official source', 'India', 'Act and Rules', 'As amended', '1940-04-10', 'https://www.indiacode.nic.in/', 'verified', array['Licensing','ASU medicines','Manufacturing']),
('SRC-PATENTS-ACT', 'The Patents Act, 1970', 'Office of the Controller General of Patents, Designs and Trade Marks', 1, 'Primary official source', 'India', 'Act', 'As amended', '1972-04-20', 'https://www.ipindia.gov.in/', 'verified', array['Patent','Novelty','Traditional knowledge exclusions']),
('SRC-TM-ACT', 'The Trade Marks Act, 1999', 'Office of the Controller General of Patents, Designs and Trade Marks', 1, 'Primary official source', 'India', 'Act', 'As amended', '2003-09-15', 'https://www.ipindia.gov.in/', 'verified', array['Trademark','Brand','Classes']),
('SRC-GI-ACT', 'Geographical Indications of Goods (Registration and Protection) Act, 1999', 'Office of the Controller General of Patents, Designs and Trade Marks', 1, 'Primary official source', 'India', 'Act', 'As amended', '2003-09-15', 'https://www.ipindia.gov.in/', 'verified', array['Geographical indication','Origin']),
('SRC-BDA', 'Biological Diversity Act, 2002 and Access and Benefit Sharing Regulations, 2014', 'National Biodiversity Authority', 1, 'Primary official source', 'India', 'Act and Regulations', 'As amended 2023', '2003-02-05', 'https://nbaindia.org/', 'verified', array['ABS','Biological resource','Benefit sharing']),
('SRC-TKDL', 'Traditional Knowledge Digital Library — access and use policy', 'CSIR and Ministry of Ayush', 3, 'Official government guidance', 'India', 'Programme documentation', 'Public information', '2001-01-01', 'https://www.tkdl.res.in/', 'needs_review', array['Prior art','Traditional knowledge','Patent examination']),
('SRC-EU-NOVEL', 'Regulation (EU) 2015/2283 on novel foods', 'European Parliament and Council', 1, 'Primary official source', 'EU', 'Regulation', '2015/2283', '2018-01-01', 'https://eur-lex.europa.eu/eli/reg/2015/2283/oj', 'verified', array['Novel food','Market authorisation','History of use']),
('SRC-US-DSHEA', 'Dietary supplement provisions of the Federal Food, Drug, and Cosmetic Act (including new dietary ingredient notification)', 'U.S. Food and Drug Administration', 1, 'Primary official source', 'US', 'Act and guidance', 'Current', '1994-10-25', 'https://www.fda.gov/', 'verified', array['Dietary supplement','New dietary ingredient','Claims']);

insert into public.documents (id, source_id, title, version, document_hash, effective_date, language) values
('DOC-FSSAI-AAHARA-01','SRC-FSSAI-AAHARA','Food Safety and Standards (Ayurveda Aahara) Regulations, 2022','2022 notification','seed-aahara-2022','2022-05-05','en'),
('DOC-FSSAI-CLAIMS-01','SRC-FSSAI-CLAIMS','Food Safety and Standards (Advertising and Claims) Regulations, 2018','2018 notification','seed-claims-2018','2018-11-19','en'),
('DOC-API-01','SRC-API','Ayurvedic Pharmacopoeia of India, Part I','Part I collection','seed-api-part1','1989-01-01','en'),
('DOC-DCA-01','SRC-DCA-ASU','Drugs and Cosmetics Act and Rules — ASU chapter','As amended','seed-dca-asu','1940-04-10','en'),
('DOC-PATENTS-01','SRC-PATENTS-ACT','The Patents Act, 1970','As amended','seed-patents-1970','1972-04-20','en'),
('DOC-TM-01','SRC-TM-ACT','The Trade Marks Act, 1999','As amended','seed-tm-1999','2003-09-15','en'),
('DOC-GI-01','SRC-GI-ACT','Geographical Indications of Goods Act, 1999','As amended','seed-gi-1999','2003-09-15','en'),
('DOC-BDA-01','SRC-BDA','Biological Diversity Act, 2002 and ABS Regulations, 2014','As amended 2023','seed-bda-2002','2003-02-05','en'),
('DOC-TKDL-01','SRC-TKDL','TKDL access and use policy overview','Public information','seed-tkdl-policy','2001-01-01','en'),
('DOC-EU-NOVEL-01','SRC-EU-NOVEL','Regulation (EU) 2015/2283 on novel foods','2015/2283','seed-eu-2015-2283','2018-01-01','en'),
('DOC-US-DSHEA-01','SRC-US-DSHEA','Dietary supplement and new dietary ingredient provisions','Current','seed-us-dshea','1994-10-25','en');

insert into public.evidence_chunks (id, document_id, source_id, section, page, topic, tags, jurisdiction, effective_date, version, authority_level, text) values
('EVD-AAHARA-004','DOC-FSSAI-AAHARA-01','SRC-FSSAI-AAHARA','Regulation 4 — Conditions for Ayurveda Aahara','6-8','Product pathway', array['ayurveda aahara','food','category','authoritative books'], 'India','2022-05-05','2022 notification',1,'Food prepared in accordance with the recipes, ingredients or processes described in the authoritative books of Ayurveda listed in the schedules may be presented as Ayurveda Aahara, subject to the conditions specified in the regulations. The category covers food for general consumption and is distinct from Ayurvedic drugs licensed under the Drugs and Cosmetics Act. Products must comply with the applicable ingredient schedules, manufacturing conditions and labelling requirements laid down for the category.'),
('EVD-AAHARA-007','DOC-FSSAI-AAHARA-01','SRC-FSSAI-AAHARA','Labelling and presentation requirements','12-14','Claims', array['labelling','claims','presentation','logo'], 'India','2022-05-05','2022 notification',1,'Ayurveda Aahara products carry specific labelling obligations including the prescribed category logo, the applicable authoritative book reference, and restrictions on presentation. Labels and advertising must not present the food as a drug or represent it as treating, preventing or curing any disease or disorder.'),
('EVD-AAHARA-009','DOC-FSSAI-AAHARA-01','SRC-FSSAI-AAHARA','Licensing and manufacturing conditions','15-17','Regulatory route', array['licence','manufacturing','fssai','hygiene'], 'India','2022-05-05','2022 notification',1,'Manufacture of Ayurveda Aahara requires the applicable licence under the food safety framework, along with compliance with the hygiene and manufacturing conditions specified for the category. A separate Ayush drug licence pathway applies where a product is intended and presented as an Ayurvedic medicine rather than as food.'),
('EVD-CLAIMS-003','DOC-FSSAI-CLAIMS-01','SRC-FSSAI-CLAIMS','General principles for claims','5-9','Claims', array['claims','health claim','nutrition claim','substantiation'], 'India','2018-11-19','2018 notification',1,'Claims made for a food must be truthful, unambiguous and capable of substantiation by the food business operator. Health claims and nutrition claims are subject to specified conditions, and disease risk reduction or treatment claims are restricted. Claims referencing traditional use must not be presented so as to imply therapeutic effect where the product is marketed as food.'),
('EVD-API-ASH-01','DOC-API-01','SRC-API','Monograph — Ashwagandha (Withania somnifera root)','19-21','Ingredient identity', array['ashwagandha','withania somnifera','identity','root','quality'], 'India','1989-01-01','Part I collection',2,'The monograph describes the recognised identity, macroscopic and microscopic characters, and quality parameters for the dried root of Withania somnifera (Ashwagandha), including tests for identity, purity and assay. It establishes the pharmacopoeial standard for the raw material but does not by itself determine the regulatory category of a finished product or the acceptability of claims made for it.'),
('EVD-API-GEN-02','DOC-API-01','SRC-API','General notices — preparation and formulation','3-7','Preparation', array['formulation','classical preparation','extract','process'], 'India','1989-01-01','Part I collection',2,'General notices describe classical preparation methods and the conditions under which a preparation is treated as conforming to a pharmacopoeial formulation. Departures from the described preparation, including changed solvent, ratio or process, mean the preparation is not a classical formulation as described and require separate assessment.'),
('EVD-DCA-ASU-01','DOC-DCA-01','SRC-DCA-ASU','Licensing of Ayurvedic, Siddha and Unani drugs','—','Regulatory route', array['asu licence','manufacturing','drug','ayush'], 'India','1940-04-10','As amended',1,'Manufacture of Ayurvedic, Siddha and Unani drugs requires a licence from the State Licensing Authority, with distinct requirements for medicines described in the authoritative books and for patent or proprietary medicines. Whether a product falls under this pathway depends on its composition, presentation and the claims made for it.'),
('EVD-PAT-3P','DOC-PATENTS-01','SRC-PATENTS-ACT','Section 3 — Inventions not patentable','—','IP pathway', array['patent','section 3(p)','traditional knowledge','section 3(e)','aggregation'], 'India','1972-04-20','As amended',1,'An invention which in effect is traditional knowledge, or which is an aggregation or duplication of known properties of traditionally known components, is not an invention within the meaning of the Act. A substance obtained by mere admixture resulting only in the aggregation of the properties of the components is likewise excluded. Technical features of a process that produce an unexpected technical effect are assessed on their own merits against novelty, inventive step and industrial applicability.'),
('EVD-PAT-NOV','DOC-PATENTS-01','SRC-PATENTS-ACT','Novelty and prior art','—','IP pathway', array['patent','novelty','prior art','publication'], 'India','1972-04-20','As amended',1,'An invention must be new, meaning it has not been anticipated by publication or public use anywhere in the world before the priority date, including documented traditional knowledge. Assessment of novelty and inventive step requires a prior-art search covering patent and non-patent literature.'),
('EVD-TM-CLASS','DOC-TM-01','SRC-TM-ACT','Registrable marks and classification of goods','—','IP pathway', array['trademark','classes','distinctiveness','nice classification'], 'India','2003-09-15','As amended',1,'A mark capable of distinguishing the goods or services of one undertaking from those of others and capable of graphical representation may be registered, subject to absolute and relative grounds for refusal. Applications are filed against specified classes of goods and services, and availability depends on prior marks on the register and in use.'),
('EVD-GI-SCOPE','DOC-GI-01','SRC-GI-ACT','Scope of geographical indications','—','IP pathway', array['gi','origin','producer group','registration'], 'India','2003-09-15','As amended',1,'A geographical indication identifies goods as originating from a defined territory where a given quality, reputation or other characteristic is essentially attributable to that origin. Registration is sought by an association of producers or an authority representing the interest of producers, not ordinarily by a single commercial manufacturer.'),
('EVD-BDA-ACCESS','DOC-BDA-01','SRC-BDA','Access to biological resources and associated knowledge','—','ABS', array['abs','biological resource','access','benefit sharing','nba'], 'India','2003-02-05','As amended 2023',1,'Access to biological resources occurring in India, or knowledge associated with them, for research or commercial utilisation is regulated, with approval or intimation requirements that differ according to the category of person accessing the resource and the intended use. Benefit-sharing obligations may apply on commercialisation and on intellectual property applications based on such resources.'),
('EVD-BDA-CULT','DOC-BDA-01','SRC-BDA','Cultivated medicinal plants and exemptions','—','ABS', array['abs','cultivated','exemption','medicinal plants'], 'India','2003-02-05','As amended 2023',1,'Certain categories, including specified cultivated medicinal plants and their products, have been treated differently from wild-collected biological resources under notifications issued in this framework. Whether a given supply chain is covered depends on the documented source, cultivation status and use, so the sourcing record is central to the assessment.'),
('EVD-TKDL-ACCESS','DOC-TKDL-01','SRC-TKDL','Access and permitted use','—','Traditional knowledge', array['tkdl','prior art','access agreement','patent office'], 'India','2001-01-01','Public information',3,'The Traditional Knowledge Digital Library is a documented prior-art database of Indian traditional medicine systems, made available to patent offices and to authorised users under access agreements for the purpose of prior-art search and examination. It is not an open public database, so prior-art screening against it requires the applicable authorised access route.'),
('EVD-EU-NOVEL-03','DOC-EU-NOVEL-01','SRC-EU-NOVEL','Definition and history of use','—','Market screening', array['novel food','eu','history of use','authorisation'], 'EU','2018-01-01','2015/2283',1,'Food not used for human consumption to a significant degree within the Union before 15 May 1997 is a novel food and may be placed on the Union market only if authorised and included in the Union list. Food produced using a new production process resulting in significant changes to composition or structure falls within the definition, so extraction and processing changes are relevant to the assessment.'),
('EVD-US-NDI-02','DOC-US-DSHEA-01','SRC-US-DSHEA','New dietary ingredient notification','—','Market screening', array['us','ndi','dietary supplement','notification','structure function'], 'US','1994-10-25','Current',1,'A dietary supplement containing a new dietary ingredient generally requires a premarket notification to the agency with evidence supporting the expectation of safety, unless the ingredient has been present in the food supply in an unaltered chemical form. Structure/function claims may be made subject to substantiation and the required disclaimer, while disease claims are not permitted for supplements.');
