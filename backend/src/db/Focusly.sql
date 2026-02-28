create table Tasks(
	TID int primary key GENERATED ALWAYS AS IDENTITY,
	def varchar(100),
	cat_type varchar(20),
	effort_level varchar(20),
	energy_type varchar(20),
	UID int,
	created_at timetz not NULL,
	completed_dropped varchar(20)
);

select*from tasks;
create table recurring(
	TID int primary key,
	PID int,
	next_recur_date date,
	start_date date,
	recur_rate int not null,
	recur_unit varchar(6),
	end_date date,
	completion_rate int,
	miss_rate int,
	time_alloted_in_hrs int,
	Remarks varchar(500)
);
ALTER TABLE recurring
RENAME COLUMN time_alloted_in_hrs to time_allotted;
ALTER TABLE recurring
ADD column time_unit varchar(6);
select*from recurring;

create table dependent(
	TID int primary key,
	PID int,
	reschedule_count int,
	due_date date,
	Real_end_date date,
	priority int,
	completion_rate int,
	time_alloted_in_hrs int,
	Remarks varchar(500)
);
ALTER TABLE dependent
RENAME COLUMN time_alloted_in_hrs to time_allotted;
ALTER TABLE dependent
ADD column time_unit varchar(6);
select* from dependent;

create table users(
	UID int primary key GENERATED ALWAYS AS IDENTITY,
	uname varchar(50),
	username varchar(50) not null,
	pass varchar(8) not null,
	userSettings varchar(10),
	refreshToken text
);

select* from users;

create table dependency(
	TID int GENERATED ALWAYS AS IDENTITY,
	dependent_on int,
	primary Key(TID, dependent_on)
);

create table notes(
	NID int primary key GENERATED ALWAYS AS IDENTITY,
	TID int,
	def varchar(1000),
	created_at timetz
);

create table reminders(
	RID int primary key GENERATED ALWAYS AS IDENTITY,
	def varchar(100),
	ring_at timestamptz,
	created_at timetz
);

create table sync_changes(
	sid int primary key GENERATED ALWAYS AS IDENTITY,
	uid int,
	obj_type char(3), /* CID, TID, RID, NID */
	obj_id int,
	act char(6), /* create, update, delete */
	ver int, /*version - updated monotonically for each user seperately*/
	created_at timetz
);

select*from sync_changes;

create table checkbox(
	CID int primary key GENERATED ALWAYS AS IDENTITY,
	obj_type char(3),
	obj_id int,
	stamp timestamptz
);

SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';

-- Link Recurring tasks to Main Tasks
ALTER TABLE recurring
ADD CONSTRAINT fk_recurring_task
FOREIGN KEY (TID) REFERENCES Tasks(TID)
ON DELETE CASCADE;

-- Link Dependent tasks to Main Tasks
ALTER TABLE dependent
ADD CONSTRAINT fk_dependent_task
FOREIGN KEY (TID) REFERENCES Tasks(TID)
ON DELETE CASCADE;

-- Link Tasks to Users
ALTER TABLE Tasks
ADD CONSTRAINT fk_task_user
FOREIGN KEY (UID) REFERENCES users(UID)
ON DELETE CASCADE;

-- Link Sync Changes to Users (Crucial for sync logic)
ALTER TABLE sync_changes
ADD CONSTRAINT fk_sync_user
FOREIGN KEY (uid) REFERENCES users(uid)
ON DELETE CASCADE;

-- Link the dependent task
ALTER TABLE dependency
ADD CONSTRAINT fk_dep_main_task
FOREIGN KEY (TID) REFERENCES Tasks(TID)
ON DELETE CASCADE;

-- Link the 'parent' task it depends on
ALTER TABLE dependency
ADD CONSTRAINT fk_dep_parent_task
FOREIGN KEY (dependent_on) REFERENCES Tasks(TID)
ON DELETE CASCADE;