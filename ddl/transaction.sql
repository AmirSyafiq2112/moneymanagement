drop table if exists transactions;

create table transactions (
    id varchar(36) primary key,
    transaction_name varchar(255) not null,
    value float not null,
    description text,
    dt_transaction timestamp default now()
);