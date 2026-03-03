-- 1. 自定义 NCEA 等级类型
CREATE TYPE ncea_mastery_level AS ENUM (
    'Not Achieved',
    'Achieved',
    'Merit',
    'Excellence'
);

-- 2. 标准表
CREATE TABLE standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    credits INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    source_ref VARCHAR(255) 
);

-- 3. 学习日志
CREATE TABLE learning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(100) NOT NULL DEFAULT 'Sebastian',
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_summary TEXT NOT NULL,
    wombatbot_evaluation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL DEFAULT 'WombatBot',
    source_ref VARCHAR(255)
);

-- 4. 进度追踪
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(100) NOT NULL DEFAULT 'Sebastian',
    standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
    learning_log_id UUID REFERENCES learning_logs(id) ON DELETE SET NULL,
    mastery_level ncea_mastery_level NOT NULL DEFAULT 'Not Achieved',
    focused_topic VARCHAR(255),
    evaluation_notes TEXT,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    source_ref VARCHAR(255)
);

-- 5. 资源映射
CREATE TABLE resource_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    url_or_reference VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    source_ref VARCHAR(255)
);
