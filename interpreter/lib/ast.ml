(** Abstract Syntax Tree for Barbie-lang *)

type binop =
  | Add | Sub | Mul | Div | Pow
  | Eq | Neq | Lt | Lte | Gt | Gte
  | And | Or

type unop = Not | Neg

type expr =
  | Num of float
  | Str of string
  | Bool of bool
  | None
  | Var of string
  | List of expr list
  | BinOp of binop * expr * expr
  | UnOp of unop * expr
  | Call of string * expr list  (** e.g. Ken.say("hello") *)
  | GetItem of expr * expr       (** e.g. a[0] *)
  | Slice of expr * expr option * expr option (** e.g. a[1:3] *)

type stmt =
  | Assign of string * expr
  | Expr of expr
  | Feel of (expr * stmt list) list * stmt list option
    (** feel/elif/else: list of (condition, body) pairs + optional else body *)
  | Keepgoing of expr * stmt list
    (** keepgoing <cond>: ... *)
  | Somanytimes of expr * stmt list
    (** somanytimes <count>: ... *)
  | Strut of string * expr * stmt list
    (** strut <var> in runway(<count>): ... *)
  | Dream of string * string list * stmt list
    (** dream <name>(<params>): ... *)
  | Gift of expr
    (** return <expr> *)
  | Kenough
    (** break *)
  | Kentinue
  | Pass

type program = stmt list
