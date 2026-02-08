(** Abstract Syntax Tree for Barbie-lang *)

type binop =
  | Add | Sub | Mul | Div | Pow
  | Eq | Neq | Lt | Lte | Gt | Gte

type expr =
  | Num of float
  | Str of string
  | Bool of bool
  | None
  | Var of string
  | BinOp of binop * expr * expr
  | Call of string * expr list  (** e.g. Ken.say("hello") *)

type stmt =
  | Assign of string * expr
  | Expr of expr
  | Feel of (expr * stmt list) list * stmt list option
    (** feel/elif/else: list of (condition, body) pairs + optional else body *)
  | Keepgoing of expr * stmt list
    (** keepgoing <cond>: ... *)
  | Strut of string * expr * stmt list
    (** strut <var> in runway(<count>): ... *)
  | Kenough
    (** break *)
  | Continue
  | Pass

type program = stmt list
