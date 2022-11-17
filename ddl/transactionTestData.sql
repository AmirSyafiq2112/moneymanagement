-- insert into transactions (id, transaction_name, value, description)
-- values ('b2551af8-b6f5-40bf-bab6-44e8be419429', 'Test transaction 1', 20, 'Dummy description');

-- insert into transactions (id, transaction_name, value, description)
-- values ('71a9f3c3-3539-4264-a07c-ad49076d30a7', 'Test transaction 2', 30, 'Dummy description');

-- insert into transactions (id, transaction_name, value)
-- values ('6490d4bb-dbc8-44a7-9563-3ec112cd6a26', 'Test transaction 3', 45.5);

-- delete from transactions where id = 'testingTransaction2';

-- docker exec -it moneymanagementsystem-postgres-1 bash
-- docker exec -it moneymanagementsystem-postgres-1 psql -U test -f ./ddl/transactionTestData.sql 

select * from transactions;

