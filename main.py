#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""
@Project: calcI
@File: main.py
@IDE: PyCharm
@Author: paidaxing
@Date: 2024/8/18 17:22
"""
import math
import numpy_financial as npf


def average_capital_plus_interest(loan_principal: int, interest_rate: float, periods: int) -> None:
    monthly_payment = loan_principal * interest_rate * (1 + interest_rate) ** periods / (
            (1 + interest_rate) ** periods - 1)
    print('===> 每月还款额为：{:>,.2f} 元'.format(monthly_payment))
    cash_flow = [-loan_principal] + [monthly_payment] * periods
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 年利化率为：{:>,.2f}'.format(apr))

def average_capital(loan_principal: int, interest_rate: float, periods: int) -> None:
    cash_flow = [-loan_principal]
    for i in range(1, periods + 1):
        monthly_payment = loan_principal / periods + (loan_principal - loan_principal / periods * (i - 1)) * interest_rate
        print('===> 第 {} 月还款额为：{:>,.2f} 元'.format(i, monthly_payment))
        cash_flow = cash_flow + [monthly_payment]
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 年利化率为：{:>,.2f}'.format(apr))

def equal_capital_and_interest(loan_principal: int, interest_rate: float, periods: int) -> None:
    b = loan_principal / periods
    i = loan_principal * interest_rate / 12
    monthly_payment = b + i
    print('===> 每月偿还本金为 {:>,.2f} 元 利息 {:>,.2f} 元 还款额 {:>,.2f} 元'.format(b, i, monthly_payment))
    cash_flow = [-loan_principal] + [monthly_payment] * periods
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 年利化率为：{:>,.2f}'.format(apr))

def interest_before_capital(loan_principal: int, interest_rate: float, periods: int) -> None:
    print('该还款方式仅还利息，到期一次性偿还本金')
    monthly_payment = loan_principal * interest_rate
    print('===> 月还款额为：{:>,.2f} 元'.format(monthly_payment))
    apr = interest_rate
    print('===> 年利化率为：{:>,.2f}'.format(apr))

def interest_equal_increment(loan_principal: int, interest_rate: float, periods: int) -> None:
    print('该还款方式是每月逐渐递增或递减')
    increment = float(input('请输入每月还款额递增额：'))
    cash_flow = [-loan_principal]
    a1 = (loan_principal - (periods * (periods - 1) * increment) / 2) / periods
    for i in range(1, periods + 1):
        print('===> 第 {} 月还款额为：{:>,.2f} 元'.format(i, a1 - increment * (i - 1)))
        cash_flow = cash_flow + [a1 - increment * (i - 1)]
    irr = npf.irr(cash_flow)
    print('===> 内含报酬率为：{:>,.2f}'.format(irr))
    apr = (1 + irr) ** 12 - 1
    print('===> 年利化率为：{:>,.2f}'.format(apr))

def repay_the_principal_and_interest_at_one_time(loan_principal: int, interest_rate: float, periods: int) -> None:
    print('该还款方式为一次性偿还本金和全部利息')
    monthly_payment = loan_principal * math.ceil(interest_rate * periods / 12)
    print('===> 月还款额为：{:>,.2f} 元'.format(monthly_payment))
    apr = interest_rate
    print('===> 年利化率为：{:>,.2f}'.format(apr))

if __name__ == '__main__':
    print('以月还为基础计算，其他周期利率请勿使用'.center(80, '='))
    loan_principal = int(input('请输入贷款本金：'))
    interest_rate = float(input('请输入每期利率(月)：'))
    periods = int(input('请输入分期期数：'))
    method = input(
        '请输入还款方式:\n(1) 月等额本息\n(2) 月等额本金\n(3) 月等本等息\n(4) 先息后本\n(5) 一次性还本付息\n')
    if method == '1':
        average_capital_plus_interest(loan_principal, interest_rate, periods)
    elif method == '2':
        average_capital(loan_principal, interest_rate, periods)
    elif method == '3':
        equal_capital_and_interest(loan_principal, interest_rate, periods)
    elif method == '4':
        interest_before_capital(loan_principal, interest_rate, periods)
    elif method == '5':
        repay_the_principal_and_interest_at_one_time(loan_principal, interest_rate, periods)
    elif method == '6':
        interest_equal_increment(loan_principal, interest_rate, periods)
    else:
        print("若你还款方式为随借随还，请自行计算利息，年利化率等于年利率")



