-- 30_portfolio_event_extensions.sql
-- Phase 7 surfaces profit credits on the /account/portfolio profit history
-- card. Profit crediting writes a row into investment_plan_events with a
-- dedicated action type so the Phase 7 view can filter for credits without
-- heuristics. Adding the enum value in its own file so later view/RPC files
-- in Phase 7 can reference it.

alter type public.admin_action_type add value if not exists 'plan_profit_credited';
