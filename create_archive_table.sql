-- DOKITA — Table test_results_archive
-- À exécuter dans Supabase SQL Editor
-- Cette table n'est JAMAIS effacée

CREATE TABLE IF NOT EXISTS test_results_archive (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id                  UUID NOT NULL,
  run_date                TIMESTAMPTZ,
  disease                 TEXT,
  test_type               TEXT,
  patient_age             INTEGER,
  patient_sexe            TEXT,
  patient_poids           FLOAT,
  patient_ville           TEXT,
  patient_cas_special     TEXT,
  phase                   TEXT,
  result                  TEXT CHECK (result IN ('PASS','FAIL','WARN')),
  champs_ok               JSONB DEFAULT '[]',
  champs_ko               JSONB DEFAULT '[]',
  explication_ko          TEXT,
  afribot_diagnostic      TEXT,
  diagnostic_attendu      TEXT,
  diagnostic_correct      BOOLEAN,
  medicaments_oms         TEXT,
  medicaments_prescrits   TEXT,
  posologie_conforme      BOOLEAN,
  ecart_posologie         TEXT,
  validation_ia_statut    TEXT,
  validation_ia_attendu   TEXT,
  validation_ia_correcte  BOOLEAN,
  examens_oms             TEXT,
  examens_prescrits       TEXT,
  examens_manquants       TEXT,
  recurrence_detectee     BOOLEAN,
  contre_indication_detectee BOOLEAN,
  duration_api_rag_ms     INTEGER,
  duration_api_save_ms    INTEGER,
  duration_total_ms       INTEGER,
  consultation_snapshot   JSONB DEFAULT '{}',
  ordonnance_conservee    BOOLEAN DEFAULT FALSE,
  ordonnance_id           UUID,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_archive_run_id   ON test_results_archive(run_id);
CREATE INDEX IF NOT EXISTS idx_archive_disease  ON test_results_archive(disease);
CREATE INDEX IF NOT EXISTS idx_archive_result   ON test_results_archive(result);
CREATE INDEX IF NOT EXISTS idx_archive_run_date ON test_results_archive(run_date);

-- Vue résumé par run
CREATE OR REPLACE VIEW vw_test_summary AS
SELECT
  run_id,
  run_date::DATE as date_run,
  COUNT(*) as total_tests,
  COUNT(*) FILTER (WHERE result='PASS') as nb_pass,
  COUNT(*) FILTER (WHERE result='FAIL') as nb_fail,
  COUNT(*) FILTER (WHERE result='WARN') as nb_warn,
  ROUND(COUNT(*) FILTER (WHERE result='PASS') * 100.0 / COUNT(*), 1) as taux_pass,
  COUNT(DISTINCT disease) as nb_maladies
FROM test_results_archive
GROUP BY run_id, run_date::DATE
ORDER BY run_date::DATE DESC;

-- Vue résumé par maladie (tous les runs)
CREATE OR REPLACE VIEW vw_disease_summary AS
SELECT
  disease,
  COUNT(*) as total_tests,
  COUNT(*) FILTER (WHERE result='PASS') as nb_pass,
  COUNT(*) FILTER (WHERE result='FAIL') as nb_fail,
  COUNT(*) FILTER (WHERE result='WARN') as nb_warn,
  ROUND(COUNT(*) FILTER (WHERE result='PASS') * 100.0 / COUNT(*), 1) as taux_pass,
  MAX(run_date) as dernier_run
FROM test_results_archive
GROUP BY disease
ORDER BY taux_pass ASC;

-- Vue ordonnances conservées (pour test pharmacie)
CREATE OR REPLACE VIEW vw_ordonnances_test AS
SELECT
  disease,
  ordonnance_id,
  run_date,
  patient_age,
  patient_sexe,
  patient_cas_special
FROM test_results_archive
WHERE ordonnance_conservee = TRUE
  AND ordonnance_id IS NOT NULL
ORDER BY run_date DESC, disease;

COMMENT ON TABLE test_results_archive IS 'Résultats permanents du bot de test Dokita — NE JAMAIS EFFACER';
